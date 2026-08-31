import asyncio
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "cotacoes.json"

# “Principais, mais conhecidas”
COMMODITIES: list[str] = [
    "soja",
    "milho",
    "boi",
    "cafe",
    "algodao",
    "trigo",
]


@dataclass(frozen=True)
class QuoteItem:
    commodity: str
    uf: str
    price: float
    currency: str
    unit: str
    date: str
    source: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _to_records(df: Any) -> list[dict[str, Any]]:
    # pandas
    if hasattr(df, "to_dict"):
        try:
            return list(df.to_dict(orient="records"))  # type: ignore[arg-type]
        except Exception:
            pass
    # polars
    if hasattr(df, "to_dicts"):
        try:
            return list(df.to_dicts())  # type: ignore[no-any-return]
        except Exception:
            pass
    raise RuntimeError("DataFrame não suportado (não consegui extrair records).")


def _last_record(df: Any) -> dict[str, Any]:
    recs = _to_records(df)
    if not recs:
        raise RuntimeError("Dataset retornou vazio.")
    return recs[-1]


def _pick_first_key(d: dict[str, Any], keys: Iterable[str]) -> str | None:
    lower_map = {str(k).lower(): k for k in d.keys()}
    for k in keys:
        real = lower_map.get(k.lower())
        if real is not None:
            return str(real)
    return None


def _as_float(v: Any) -> float:
    if v is None:
        raise ValueError("valor vazio")
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if not s:
        raise ValueError("valor vazio")
    # normaliza número BR (1.234,56)
    s = s.replace(".", "").replace(",", ".")
    return float(s)


def _infer_price_key(rec: dict[str, Any]) -> str:
    candidates = [
        "preco",
        "preço",
        "valor",
        "price",
        "valor_rs",
        "valor_brl",
        "preco_rs",
        "preco_brl",
    ]
    k = _pick_first_key(rec, candidates)
    if k:
        return k

    # fallback: primeira coluna numérica “boa”
    for key, val in rec.items():
        lk = str(key).lower()
        if lk in {"ano", "mes", "mês"}:
            continue
        try:
            _ = _as_float(val)
            return str(key)
        except Exception:
            continue

    raise RuntimeError("Não consegui inferir qual coluna é o preço no dataset.")


def _infer_date(rec: dict[str, Any]) -> str:
    k = _pick_first_key(rec, ["data", "date", "dia"])
    if not k:
        return ""
    v = rec.get(k)
    if v is None:
        return ""
    # Mantém ISO/strings; se vier datetime, serializa.
    if hasattr(v, "isoformat"):
        try:
            return v.isoformat()[:10]
        except Exception:
            return str(v)
    s = str(v).strip()
    return s[:10] if len(s) >= 10 else s


def _infer_unit(rec: dict[str, Any]) -> str:
    k = _pick_first_key(rec, ["unidade", "unit"])
    if not k:
        return ""
    return str(rec.get(k) or "").strip()


def _infer_uf(rec: dict[str, Any]) -> str:
    k = _pick_first_key(rec, ["uf", "estado"])
    if not k:
        return "BR"
    uf = str(rec.get(k) or "").strip().upper()
    return uf or "BR"


def _infer_commodity(rec: dict[str, Any], default_name: str) -> str:
    k = _pick_first_key(rec, ["produto", "commodity", "cultura", "indicador"])
    if not k:
        # default com capitalização “bonita”
        return default_name.title().replace("Boi", "Boi").replace("Cafe", "Café")
    v = str(rec.get(k) or "").strip()
    return v or default_name.title()


async def _fetch_one(name: str) -> QuoteItem:
    from agrobr import datasets  # import aqui para falhar rápido no CI se faltar

    df, meta = await datasets.preco_diario(name, return_meta=True)
    rec = _last_record(df)

    price_key = _infer_price_key(rec)
    price = _as_float(rec.get(price_key))

    commodity_label = _infer_commodity(rec, name)
    uf = _infer_uf(rec)
    unit = _infer_unit(rec) or ("@ 15kg" if name == "boi" else "sc 60kg")
    date = _infer_date(rec)
    source = getattr(meta, "source", None) or "Agrobr"

    return QuoteItem(
        commodity=commodity_label,
        uf=uf,
        price=price,
        currency="BRL",
        unit=unit,
        date=date,
        source=str(source),
    )


async def main() -> None:
    # Evita crash de encoding no Windows (stdout com cp1252/cp850 etc.).
    try:
        import sys

        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except Exception:
        pass

    items: list[QuoteItem] = []

    # roda em paralelo (com cuidado: poucas commodities)
    results = await asyncio.gather(*[_fetch_one(c) for c in COMMODITIES], return_exceptions=True)
    errors: list[str] = []
    for name, res in zip(COMMODITIES, results, strict=True):
        if isinstance(res, Exception):
            errors.append(f"{name}: {res}")
            continue
        items.append(res)

    if not items:
        raise SystemExit("Falha ao gerar cotações. Erros: " + " | ".join(errors))

    payload = {
        "fetchedAt": _now_iso(),
        "items": [item.__dict__ for item in items],
        "source": "agrobr",
        "errors": errors,
    }

    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Gravado: {OUT_PATH} ({len(items)} itens).")
    if errors:
        print("Avisos (algumas commodities falharam):")
        for e in errors:
            print(" -", e)


if __name__ == "__main__":
    asyncio.run(main())

