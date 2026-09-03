# -*- coding: utf-8 -*-
"""Gera carousel.html AG Assist — skill instagram-carousel."""
import base64
import io
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
OUT = ROOT / "carousel.html"

# —— Brand ——
BRAND = "AG Assist"
HANDLE = "@agassist"
BRAND_PRIMARY = "#a97440"   # acento terra (progresso, tags)
BRAND_LIGHT = "#c4925e"
BRAND_DARK = "#2a382a"      # verde mata
LIGHT_BG = "#f6f3ec"
LIGHT_BORDER = "#e8e2d6"
DARK_BG = "#1a1f1a"
TEXT = "#3a3a38"
MUTED = "#5c5c58"
CREAM = "#fdfcfa"

HEADING_FONT = "Poppins"
BODY_FONT = "Poppins"
TOTAL = 7


def to_data_uri(path: Path, max_side: int = 900, quality: int = 78) -> str:
    from PIL import Image

    img = Image.open(path).convert("RGB")
    w, h = img.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def logo_data_uri(path: Path) -> str:
    raw = path.read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return f"data:image/png;base64,{b64}"


def progress_bar(index: int, is_light: bool) -> str:
    pct = ((index + 1) / TOTAL) * 100
    track = "rgba(0,0,0,0.08)" if is_light else "rgba(255,255,255,0.12)"
    fill = BRAND_PRIMARY if is_light else "#fff"
    label = "rgba(0,0,0,0.3)" if is_light else "rgba(255,255,255,0.4)"
    return f"""<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;z-index:10;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:{track};border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:{pct}%;background:{fill};border-radius:2px;"></div>
    </div>
    <span class="sans" style="font-size:11px;color:{label};font-weight:500;">{index + 1}/{TOTAL}</span>
  </div>"""


def swipe_arrow(is_light: bool) -> str:
    bg = "rgba(0,0,0,0.06)" if is_light else "rgba(255,255,255,0.08)"
    stroke = "rgba(0,0,0,0.25)" if is_light else "rgba(255,255,255,0.35)"
    return f"""<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;display:flex;align-items:center;justify-content:center;background:linear-gradient(to right,transparent,{bg});">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="{stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>"""


def logo_lockup(light_text: bool = False, on_photo: bool = False) -> str:
    name_color = CREAM if light_text else BRAND_DARK
    if on_photo:
        return f"""<div style="display:inline-flex;align-items:center;gap:8px;">
      <div style="width:34px;height:34px;border-radius:50%;background:rgba(253,252,250,0.95);display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="{{LOGO}}" alt="" style="width:24px;height:24px;object-fit:contain;">
      </div>
      <span class="serif" style="font-size:14px;font-weight:600;letter-spacing:0.2px;color:{CREAM};text-shadow:0 1px 8px rgba(0,0,0,0.35);">{BRAND}</span>
    </div>"""
    return f"""<div style="display:flex;align-items:center;gap:10px;">
      <div style="width:40px;height:40px;border-radius:50%;background:{CREAM};display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid {LIGHT_BORDER};">
        <img src="{{LOGO}}" alt="" style="width:28px;height:28px;object-fit:contain;">
      </div>
      <span class="serif" style="font-size:13px;font-weight:700;letter-spacing:0.2px;color:{name_color};">{BRAND}</span>
    </div>"""


def main():
    logo = logo_data_uri(ASSETS / "logo.png")
    campo = to_data_uri(ASSETS / "hero-agro.jpg", max_side=1300, quality=84)
    soja = to_data_uri(ASSETS / "soja.jpg", max_side=700)
    hero = to_data_uri(ASSETS / "campo-sol.jpg", max_side=1000, quality=80)

    lockup_dark = logo_lockup(False).replace("{LOGO}", logo)
    lockup_light = logo_lockup(True).replace("{LOGO}", logo)
    lockup_photo = logo_lockup(on_photo=True).replace("{LOGO}", logo)

    slides = []

    # 1 HERO — full-bleed no estilo das referências (selo + foto + deslize)
    slides.append(f"""
    <div class="slide" data-i="0">
      <img src="{campo}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 45%;z-index:0;">
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(26,31,26,0.48) 0%,rgba(26,31,26,0.42) 38%,rgba(26,31,26,0.72) 62%,rgba(26,31,26,0.92) 100%);z-index:1;"></div>
      <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;padding:20px 28px 56px;">
        {lockup_photo}
        <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:0 12px 0 12px;">
          <h2 class="serif" style="font-size:30px;font-weight:600;letter-spacing:-0.35px;line-height:1.18;color:{CREAM};max-width:320px;text-align:center;text-shadow:0 2px 18px rgba(0,0,0,0.75);">
            Vi <span style="font-weight:800">mancha na folha</span> e o técnico está longe.
          </h2>
          <div style="display:flex;align-items:center;gap:10px;margin-top:22px;justify-content:center;">
            <span class="sans" style="font-size:13px;font-weight:700;color:{CREAM};text-shadow:0 1px 10px rgba(0,0,0,0.7);">Deslize para o lado</span>
            <div style="width:28px;height:28px;border-radius:8px;background:{BRAND_PRIMARY};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.35);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#fdfcfa" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>
      {progress_bar(0, False)}
    </div>""")

    # 2 PROBLEM — dark
    slides.append(f"""
    <div class="slide" data-i="1">
      <div style="position:absolute;inset:0;background:{DARK_BG};"></div>
      <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 52px;">
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{BRAND_LIGHT};margin-bottom:16px;">SE VOCÊ ESPERA</span>
        <h2 class="serif" style="font-size:30px;font-weight:800;letter-spacing:-0.3px;line-height:1.12;color:{CREAM};">Amanhã pode ser tarde demais.</h2>
        <div style="width:36px;height:3px;background:{BRAND_PRIMARY};border-radius:2px;margin:16px 0;"></div>
        <p class="sans" style="font-size:14px;line-height:1.5;color:rgba(253,252,250,0.7);">Chute errado. Praga que espalha. Custo que sobe — tudo começa com uma dúvida parada.</p>
      </div>
      {progress_bar(1, False)}
      {swipe_arrow(False)}
    </div>""")

    # 3 SCENE — photo dark overlay
    slides.append(f"""
    <div class="slide" data-i="2">
      <img src="{soja}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">
      <div style="position:absolute;inset:0;background:rgba(26,31,26,0.62);z-index:1;"></div>
      <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 52px;">
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{BRAND_LIGHT};margin-bottom:16px;">A CENA</span>
        <h2 class="serif" style="font-size:28px;font-weight:800;letter-spacing:-0.3px;line-height:1.12;color:{CREAM};">Sol alto. Sinal fraco. Dúvida na mão.</h2>
        <p class="sans" style="font-size:14px;line-height:1.5;color:rgba(253,252,250,0.75);margin-top:14px;">Você para na linha, olha a folha — e o técnico não chega agora.</p>
      </div>
      {progress_bar(2, False)}
      {swipe_arrow(False)}
    </div>""")

    # 4 SOLUTION — brand gradient
    slides.append(f"""
    <div class="slide" data-i="3">
      <div style="position:absolute;inset:0;background:linear-gradient(165deg,{BRAND_DARK} 0%,#3d4f3d 45%,{BRAND_PRIMARY} 100%);"></div>
      <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px 52px;">
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:rgba(255,255,255,0.6);margin-bottom:16px;">E SE…</span>
        <h2 class="serif" style="font-size:28px;font-weight:800;letter-spacing:-0.3px;line-height:1.12;color:{CREAM};">Tirasse a dúvida em segundos, no WhatsApp?</h2>
        <div style="margin-top:20px;padding:16px;background:rgba(0,0,0,0.18);border-radius:12px;border:1px solid rgba(255,255,255,0.1);">
          <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:6px;">Na prática</p>
          <p class="sans" style="font-size:15px;font-weight:600;color:#fff;line-height:1.4;">Foto da folha. Texto curto. Resposta clara — ainda no campo.</p>
        </div>
      </div>
      {progress_bar(3, False)}
      {swipe_arrow(False)}
    </div>""")

    # 5 FEATURES — light
    features = [
        ("01", "Foto, texto ou áudio", "Manda do jeito que estiver no campo"),
        ("02", "Resposta em segundos", "Orientação prática, sem enrolação"),
        ("03", "Decisão no momento", "Apoio quando o técnico está longe"),
    ]
    feat_html = ""
    for n, title, desc in features:
        feat_html += f"""
        <div style="display:flex;align-items:flex-start;gap:14px;padding:12px 0;border-bottom:1px solid {LIGHT_BORDER};">
          <span class="serif" style="font-size:22px;font-weight:700;color:{BRAND_PRIMARY};min-width:34px;line-height:1;">{n}</span>
          <div>
            <div class="sans" style="font-size:14px;font-weight:600;color:{BRAND_DARK};">{title}</div>
            <div class="sans" style="font-size:12px;color:{MUTED};margin-top:2px;">{desc}</div>
          </div>
        </div>"""

    slides.append(f"""
    <div class="slide" data-i="4">
      <div style="position:absolute;inset:0;background:{LIGHT_BG};"></div>
      <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 52px;">
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{BRAND_PRIMARY};margin-bottom:12px;">A SOLUÇÃO</span>
        <h2 class="serif" style="font-size:30px;font-weight:800;letter-spacing:-0.3px;line-height:1.12;color:{BRAND_DARK};margin-bottom:8px;">{BRAND}</h2>
        <p class="sans" style="font-size:13px;color:{MUTED};margin-bottom:8px;">Orientação prática no WhatsApp.</p>
        {feat_html}
      </div>
      {progress_bar(4, True)}
      {swipe_arrow(True)}
    </div>""")

    # 6 HOW-TO — light
    steps = [
        ("01", "Cadastre-se", "Leva poucos minutos no site"),
        ("02", "Abra o WhatsApp", "Mande a foto da folha"),
        ("03", "Receba orientação", "Decida ainda no campo"),
    ]
    steps_html = ""
    for n, title, desc in steps:
        steps_html += f"""
        <div style="display:flex;align-items:flex-start;gap:16px;padding:14px 0;border-bottom:1px solid {LIGHT_BORDER};">
          <span class="serif" style="font-size:26px;font-weight:700;color:{BRAND_PRIMARY};min-width:34px;line-height:1;">{n}</span>
          <div>
            <div class="sans" style="font-size:14px;font-weight:600;color:{BRAND_DARK};">{title}</div>
            <div class="sans" style="font-size:12px;color:{MUTED};margin-top:2px;">{desc}</div>
          </div>
        </div>"""

    slides.append(f"""
    <div class="slide" data-i="5">
      <div style="position:absolute;inset:0;background:{CREAM};"></div>
      <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 52px;">
        <span class="sans" style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:2px;color:{BRAND_PRIMARY};margin-bottom:14px;">EM 3 PASSOS</span>
        <h2 class="serif" style="font-size:30px;font-weight:800;letter-spacing:-0.3px;line-height:1.12;color:{BRAND_DARK};margin-bottom:12px;">Como usar</h2>
        {steps_html}
        <p class="sans" style="font-size:11px;color:{MUTED};margin-top:14px;line-height:1.4;">Apoio por mensagem — não substitui visita técnica em urgência.</p>
      </div>
      {progress_bar(5, True)}
      {swipe_arrow(True)}
    </div>""")

    # 7 CTA — gradient, no arrow
    slides.append(f"""
    <div class="slide" data-i="6">
      <img src="{hero}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:0.35;">
      <div style="position:absolute;inset:0;background:linear-gradient(165deg,rgba(42,56,42,0.92) 0%,rgba(42,56,42,0.88) 50%,rgba(169,116,64,0.85) 100%);z-index:1;"></div>
      <div style="position:relative;z-index:2;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:0 36px 52px;">
        {lockup_light}
        <h2 class="serif" style="font-size:28px;font-weight:800;letter-spacing:-0.3px;line-height:1.12;color:{CREAM};margin-top:28px;">Pronto para tirar a dúvida no campo?</h2>
        <p class="sans" style="font-size:14px;line-height:1.5;color:rgba(253,252,250,0.8);margin-top:12px;">Mande a foto da folha agora.</p>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{CREAM};color:{BRAND_DARK};font-family:'{BODY_FONT}',sans-serif;font-weight:600;font-size:14px;border-radius:28px;margin-top:22px;">
          Começar grátis
        </div>
        <p class="sans" style="font-size:12px;color:rgba(253,252,250,0.75);margin-top:14px;">14 dias ou 10 análises · a partir de R$ 29/mês</p>
        <p class="sans" style="font-size:10px;color:rgba(253,252,250,0.5);margin-top:10px;line-height:1.35;max-width:280px;">Não substitui receituário, laudo nem emergência.</p>
      </div>
      {progress_bar(6, False)}
    </div>""")

    track = "\n".join(slides)

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{BRAND} — Carrossel Instagram</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: '{BODY_FONT}', system-ui, sans-serif;
    background: #0e100e;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px 64px;
    color: {CREAM};
  }}
  .serif {{ font-family: '{HEADING_FONT}', Georgia, serif; }}
  .sans {{ font-family: '{BODY_FONT}', system-ui, sans-serif; }}
  .page-note {{
    max-width: 420px;
    margin-bottom: 20px;
    font-size: 13px;
    line-height: 1.45;
    color: rgba(253,252,250,0.65);
    text-align: center;
  }}
  .page-note strong {{ color: {BRAND_LIGHT}; }}
  .ig-frame {{
    width: 420px;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
  }}
  .ig-header {{
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid #efefef;
  }}
  .ig-avatar {{
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: {BRAND_DARK};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .ig-avatar img {{ width: 22px; height: 22px; object-fit: contain; }}
  .ig-meta {{ display: flex; flex-direction: column; }}
  .ig-handle {{ font-size: 13px; font-weight: 600; color: #111; }}
  .ig-sub {{ font-size: 11px; color: #8e8e8e; }}
  .carousel-viewport {{
    width: 420px;
    height: 525px;
    overflow: hidden;
    cursor: grab;
    position: relative;
    touch-action: pan-y;
  }}
  .carousel-viewport:active {{ cursor: grabbing; }}
  .carousel-track {{
    display: flex;
    width: {TOTAL * 420}px;
    height: 525px;
    transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
    will-change: transform;
  }}
  .slide {{
    position: relative;
    width: 420px;
    height: 525px;
    flex-shrink: 0;
    overflow: hidden;
  }}
  .ig-dots {{
    display: flex;
    justify-content: center;
    gap: 5px;
    padding: 10px 0 4px;
    background: #fff;
  }}
  .ig-dots span {{
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #dbdbdb;
  }}
  .ig-dots span.on {{ background: {BRAND_PRIMARY}; }}
  .ig-actions {{
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 8px 14px 4px;
    background: #fff;
  }}
  .ig-actions svg {{ width: 24px; height: 24px; stroke: #262626; fill: none; stroke-width: 1.6; }}
  .ig-actions .spacer {{ flex: 1; }}
  .ig-caption {{
    padding: 4px 14px 16px;
    background: #fff;
    font-size: 13px;
    color: #262626;
    line-height: 1.4;
  }}
  .ig-caption b {{ font-weight: 600; }}
  .ig-time {{ font-size: 10px; color: #8e8e8e; margin-top: 6px; letter-spacing: 0.4px; }}
  .caption-box {{
    max-width: 420px;
    margin-top: 28px;
    background: #1a1f1a;
    border: 1px solid rgba(169,116,64,0.35);
    border-radius: 10px;
    padding: 18px 16px;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(253,252,250,0.85);
    white-space: pre-wrap;
  }}
  .caption-box h3 {{
    font-family: '{HEADING_FONT}', Georgia, serif;
    font-size: 15px;
    color: {BRAND_LIGHT};
    margin-bottom: 10px;
  }}
</style>
</head>
<body>
  <p class="page-note">Preview Instagram · deslize os slides · <strong>quais precisam de ajuste antes de exportar os PNGs?</strong></p>

  <div class="ig-frame">
    <div class="ig-header">
      <div class="ig-avatar"><img src="{logo}" alt=""></div>
      <div class="ig-meta">
        <span class="ig-handle">{HANDLE}</span>
        <span class="ig-sub">Patrocinado · AG Assist</span>
      </div>
    </div>
    <div class="carousel-viewport" id="viewport">
      <div class="carousel-track" id="track">
        {track}
      </div>
    </div>
    <div class="ig-dots" id="dots"></div>
    <div class="ig-actions">
      <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
      <svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      <span class="spacer"></span>
      <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
    </div>
    <div class="ig-caption">
      <b>{HANDLE}</b> Mancha na folha. Técnico longe. E agora? O AG Assist responde no WhatsApp.
      <div class="ig-time">HÁ 2 HORAS</div>
    </div>
  </div>

  <div class="caption-box">
    <h3>Legenda para copiar</h3>
Mancha na folha. Técnico longe. E agora?

No meio da lavoura a dúvida não espera agenda. Você precisa de orientação rápida — sem chute e sem ficar refém do grupo do WhatsApp.

Com o AG Assist você manda foto, texto ou áudio e recebe resposta clara em poucos segundos, direto no WhatsApp.

Cadastre-se, abra a conversa e mande a foto da folha.
Comece grátis: 14 dias ou 10 análises.

Link: https://campoai-production-b7c7.up.railway.app/cadastro?origin=instagram

Apoio por mensagem. Não substitui visita técnica, receituário nem emergência.

#AGAssist #Agronegocio #ProdutorRural #Lavoura #WhatsAppAgro #Soja #CampoBrasileiro #Agricultura #Manejo #DecisaoNoCampo #AgTech #OrientacaoNoCampo
  </div>

<script>
(() => {{
  const track = document.getElementById('track');
  const viewport = document.getElementById('viewport');
  const dotsEl = document.getElementById('dots');
  const total = {TOTAL};
  let idx = 0;
  let startX = 0;
  let dx = 0;
  let dragging = false;

  for (let i = 0; i < total; i++) {{
    const d = document.createElement('span');
    if (i === 0) d.classList.add('on');
    dotsEl.appendChild(d);
  }}
  const dots = [...dotsEl.children];

  function go(i) {{
    idx = Math.max(0, Math.min(total - 1, i));
    track.style.transform = 'translateX(' + (-idx * 420) + 'px)';
    dots.forEach((d, n) => d.classList.toggle('on', n === idx));
  }}

  viewport.addEventListener('pointerdown', (e) => {{
    dragging = true;
    startX = e.clientX;
    dx = 0;
    track.style.transition = 'none';
    viewport.setPointerCapture(e.pointerId);
  }});
  viewport.addEventListener('pointermove', (e) => {{
    if (!dragging) return;
    dx = e.clientX - startX;
    track.style.transform = 'translateX(' + (-idx * 420 + dx) + 'px)';
  }});
  function endDrag() {{
    if (!dragging) return;
    dragging = false;
    track.style.transition = '';
    if (dx < -50) go(idx + 1);
    else if (dx > 50) go(idx - 1);
    else go(idx);
  }}
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
}})();
</script>
</body>
</html>
"""

    OUT.write_text(html, encoding="utf-8")
    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUT} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
