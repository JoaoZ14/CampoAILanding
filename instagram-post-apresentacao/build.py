from base64 import b64encode
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT.parent / "assets"


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64,{b64encode(path.read_bytes()).decode('ascii')}"


photo = data_uri(ASSETS / "hero-campo-amanhecer.webp", "image/webp")
logo = data_uri(ASSETS / "Logo CampoLead (1)-Photoroom.png", "image/png")


def footer(number: int, dark: bool = False) -> str:
    color = "#f1f1e8" if dark else "#17362d"
    muted = "rgba(255,255,255,.35)" if dark else "rgba(23,54,45,.18)"
    arrow = "" if number == 5 else '<span class="next" aria-hidden="true">→</span>'
    return f'''<div class="slide-footer" style="color:{color}">
      <div class="progress" style="background:{muted}"><i style="width:{number*20}%;background:{color}"></i></div>
      <span class="counter">0{number} / 05</span>{arrow}
    </div>'''


html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AG Assist — post de apresentação</title>
<style>
  :root{{--ink:#17362d;--deep:#10271f;--cream:#f6f4eb;--leaf:#d8e6b9;--clay:#d29970;}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:#e9e9e2;color:var(--ink);font-family:Arial,Helvetica,sans-serif;}}
  .page{{min-height:100vh;padding:34px 20px 60px;display:flex;align-items:center;flex-direction:column;gap:18px}}
  .preview-title{{width:420px;max-width:100%;display:flex;align-items:end;justify-content:space-between;gap:20px}}
  .preview-title h1{{font:400 25px/1.1 Georgia,serif;margin:0}}
  .preview-title p{{font-size:11px;color:#617067;margin:0}}
  .ig-frame{{width:420px;max-width:100%;background:#fff;box-shadow:0 20px 70px rgba(15,39,31,.17);border-radius:13px;overflow:hidden}}
  .ig-header{{height:53px;padding:7px 12px;display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700}}
  .avatar{{width:32px;height:32px;border-radius:50%;background:var(--cream);border:1px solid #dcded2;display:grid;place-items:center;overflow:hidden}}
  .avatar img{{width:29px;height:29px;object-fit:contain}}
  .ig-header small{{font-size:10px;color:#879087;font-weight:400;display:block;margin-top:2px}}
  .dots-menu{{margin-left:auto;letter-spacing:2px;font-size:18px;line-height:1}}
  .carousel-viewport{{width:420px;height:525px;overflow:hidden;touch-action:pan-y;cursor:grab}}
  .carousel-viewport:active{{cursor:grabbing}}
  .carousel-track{{height:525px;display:flex;transition:transform .38s ease;transform:translateX(0)}}
  .slide{{width:420px;height:525px;flex:0 0 420px;position:relative;overflow:hidden}}
  .slide-inner{{position:absolute;inset:0;padding:31px 31px 53px;display:flex;flex-direction:column;z-index:2}}
  .eyebrow{{font-size:9px;font-weight:800;letter-spacing:2.4px;text-transform:uppercase}}
  .brand{{display:flex;align-items:center;gap:8px;font-weight:700;font-size:12px;letter-spacing:.2px}}
  .brand-mark{{width:27px;height:27px;border-radius:50%;background:var(--cream);display:grid;place-items:center;overflow:hidden}}
  .brand-mark img{{width:26px;height:26px;object-fit:contain}}
  .brand.light .brand-mark{{background:rgba(255,255,255,.95)}}
  .display{{font:400 42px/.99 Georgia,'Times New Roman',serif;letter-spacing:-1.8px;margin:0}}
  .display em{{font-style:italic;color:var(--leaf)}}
  .support{{font-size:13px;line-height:1.5;margin:0}}
  .slide-footer{{position:absolute;bottom:16px;left:31px;right:31px;display:flex;align-items:center;gap:10px;z-index:5}}
  .progress{{height:3px;flex:1;border-radius:10px;overflow:hidden}}
  .progress i{{height:100%;display:block;border-radius:10px}}
  .counter{{font-size:9px;font-weight:700;letter-spacing:1px;opacity:.7;white-space:nowrap}}
  .next{{font-size:21px;line-height:10px;margin-left:2px}}
  .cover{{background:var(--deep);color:white}}
  .cover-photo{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:52% center}}
  .cover::after{{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,23,15,.44) 0%,rgba(8,25,17,.05) 34%,rgba(7,26,19,.84) 77%,rgba(7,26,19,.95) 100%);z-index:1}}
  .cover .slide-inner{{justify-content:space-between}}
  .cover-main{{margin-bottom:27px}}
  .cover .display{{font-size:48px;line-height:.99;max-width:350px;margin:9px 0 15px}}
  .cover .support{{color:#f1f2e9;font-size:13px;max-width:320px}}
  .cover-tag{{border:1px solid rgba(255,255,255,.55);padding:7px 10px;border-radius:2px;display:inline-block;background:rgba(16,39,31,.28)}}
  .problem{{background:var(--cream)}}
  .problem .slide-inner{{justify-content:space-between}}
  .problem h2{{font-size:38px;line-height:1.03;margin:13px 0 11px}}
  .problem h2 em{{color:#64816a}}
  .problem .lead{{font-size:13px;line-height:1.5;color:#526257;max-width:315px}}
  .problem .cards{{display:grid;gap:8px;margin-bottom:14px}}
  .problem .card{{background:#e9ecdd;border:1px solid #dce2d1;padding:13px 15px;display:flex;gap:12px;align-items:center;border-radius:4px}}
  .card b{{font:400 23px/1 Georgia,serif;color:#729076;width:28px}}
  .card span{{font-size:14px;font-weight:700;letter-spacing:-.25px}}
  .problem .mini{{font-size:11px;color:#667769;margin:0}}
  .reveal{{background:radial-gradient(circle at 80% 8%,#315a45 0,#173a2b 42%,#10271f 100%);color:var(--cream)}}
  .reveal .slide-inner{{justify-content:space-between}}
  .reveal .display{{font-size:47px;margin:11px 0 13px}}
  .reveal .sub{{font:400 19px/1.27 Georgia,serif;color:#dce9ce;margin:0;max-width:316px}}
  .chatbox{{padding:15px;background:#eef1e8;border-radius:13px 13px 13px 2px;color:#203f30;box-shadow:0 12px 28px rgba(4,17,12,.17);margin-bottom:13px}}
  .chatbox .chathead{{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:800;color:#597363;margin-bottom:8px}}
  .chatbox p{{font:400 17px/1.35 Georgia,serif;margin:0}}
  .inputmodes{{display:flex;gap:7px;margin-bottom:10px}}
  .inputmodes span{{border:1px solid rgba(255,255,255,.32);border-radius:100px;padding:7px 12px;font-size:11px;font-weight:700}}
  .reveal-note{{font-size:11px;color:#cbd9c5;line-height:1.4;margin:0}}
  .benefits{{background:var(--cream)}}
  .benefits .display{{font-size:38px;margin:13px 0 10px}}
  .benefits .top-copy{{font-size:12px;color:#65766a;line-height:1.4;margin:0 0 15px}}
  .benefit-list{{border-top:1px solid #cbd4c4}}
  .benefit{{min-height:63px;border-bottom:1px solid #cbd4c4;display:flex;align-items:center;gap:13px}}
  .benefit b{{font:400 24px/1 Georgia,serif;color:#84a083;width:33px}}
  .benefit span{{font-size:14px;line-height:1.2;font-weight:700}}
  .fineprint{{font-size:10px;line-height:1.4;color:#6e7f70;margin-top:13px}}
  .last{{background:var(--deep);color:var(--cream)}}
  .last::before{{content:'';position:absolute;top:-90px;right:-100px;width:380px;height:380px;border:1px solid rgba(216,230,185,.18);border-radius:50%;box-shadow:0 0 0 44px rgba(216,230,185,.025),0 0 0 88px rgba(216,230,185,.025)}}
  .last .slide-inner{{justify-content:space-between}}
  .last .display{{font-size:46px;line-height:1.01;margin:14px 0 17px}}
  .last .display em{{color:var(--leaf)}}
  .last .support{{font-size:13px;color:#d6e1d1;max-width:317px}}
  .follow{{background:var(--leaf);color:var(--deep);font-size:14px;font-weight:800;padding:15px 17px;border-radius:3px;display:block;margin-bottom:14px;text-align:center}}
  .last .micro{{font-size:10px;line-height:1.45;color:#cbd9c7;margin:0;text-align:center}}
  .ig-dots{{display:flex;justify-content:center;gap:4px;padding:9px 0 2px}}
  .ig-dots span{{width:5px;height:5px;border-radius:50%;background:#cbd1cb}}
  .ig-dots .active{{background:#43614b}}
  .ig-actions{{display:flex;gap:13px;padding:10px 12px 4px;font-size:21px;line-height:1}}
  .ig-actions .save{{margin-left:auto}}
  .ig-caption{{font-size:11px;line-height:1.4;padding:3px 12px 13px;color:#303a31}}
  .caption-preview{{max-width:420px;width:100%;font-size:12px;color:#4e5a50;line-height:1.5}}
  @media(max-width:460px){{.page{{padding:10px 0 30px}}.preview-title,.caption-preview{{padding:0 10px}}.ig-frame{{border-radius:0}}}}
</style>
</head>
<body><div class="page">
<div class="preview-title"><h1>Post de apresentação</h1><p>Arraste para ver os 5 slides</p></div>
<div class="ig-frame">
  <div class="ig-header"><span class="avatar"><img src="{logo}" alt=""></span><span>agassist.ia<small>Prévia do post</small></span><span class="dots-menu">···</span></div>
  <div class="carousel-viewport"><div class="carousel-track">
    <article class="slide cover" aria-label="Slide 1">
      <img class="cover-photo" src="{photo}" alt="Lavoura ao nascer do sol">
      <div class="slide-inner">
        <div class="brand light"><span class="brand-mark"><img src="{logo}" alt=""></span>AG Assist</div>
        <div class="cover-main"><span class="eyebrow cover-tag">A vida real no campo</span><h2 class="display">A dúvida apareceu.<br><em>E agora?</em></h2><p class="support">Uma folha diferente. Um animal fora do padrão. Uma pergunta que surge no meio da lida.</p></div>
      </div>{footer(1, True)}
    </article>
    <article class="slide problem" aria-label="Slide 2"><div class="slide-inner">
      <div><span class="eyebrow">Você já passou por isso?</span><h2 class="display">Todo dia tem um <em>“isso é normal?”</em></h2><p class="lead">Antes de decidir, é preciso entender melhor o que está acontecendo.</p></div>
      <div><div class="cards"><div class="card"><b>01</b><span>Mancha na folha</span></div><div class="card"><b>02</b><span>Animal diferente do habitual</span></div><div class="card"><b>03</b><span>Dúvida sobre o manejo</span></div></div><p class="mini">Quanto melhor a informação, melhor o próximo passo.</p></div>
    </div>{footer(2)}</article>
    <article class="slide reveal" aria-label="Slide 3"><div class="slide-inner">
      <div><div class="brand light"><span class="brand-mark"><img src="{logo}" alt=""></span>AG Assist</div><p class="eyebrow" style="color:#bdd1b7;margin:38px 0 0">Sua conversa com a Lida</p><h2 class="display">Conheça<br>a <em>Lida.</em></h2><p class="sub">A assistente do AG Assist para orientar dúvidas do campo pelo WhatsApp.</p></div>
      <div><div class="chatbox"><div class="chathead">Você pode começar assim</div><p>“Encontrei manchas em algumas folhas. O que devo observar?”</p></div><div class="inputmodes"><span>Texto</span><span>Foto</span><span>Áudio</span></div><p class="reveal-note">Uma conversa simples, no aplicativo que você já usa.</p></div>
    </div>{footer(3, True)}</article>
    <article class="slide benefits" aria-label="Slide 4"><div class="slide-inner">
      <div><span class="eyebrow">Na prática</span><h2 class="display">Mais clareza para o próximo passo.</h2><p class="top-copy">A Lida ajuda você a organizar a dúvida e observar o que importa.</p></div>
      <div class="benefit-list"><div class="benefit"><b>01</b><span>Possíveis causas</span></div><div class="benefit"><b>02</b><span>O que observar</span></div><div class="benefit"><b>03</b><span>Próximos passos seguros</span></div><div class="benefit"><b>04</b><span>Quando chamar um profissional</span></div></div>
      <p class="fineprint">Orientação por mensagem. Não substitui visita técnica, laudo ou receituário.</p>
    </div>{footer(4)}</article>
    <article class="slide last" aria-label="Slide 5"><div class="slide-inner">
      <div class="brand light"><span class="brand-mark"><img src="{logo}" alt=""></span>AG Assist</div>
      <div><span class="eyebrow" style="color:#bdd1b7">Em breve</span><h2 class="display">O campo segue.<br><em>A conversa também.</em></h2><p class="support">Por aqui, vamos falar de dúvidas reais, informação útil e novidades do AG Assist.</p></div>
      <div><div class="follow">Siga @agassist.ia</div><p class="micro">Acompanhe a preparação para o lançamento.</p></div>
    </div>{footer(5, True)}</article>
  </div></div>
  <div class="ig-dots"><span class="active"></span><span></span><span></span><span></span><span></span></div>
  <div class="ig-actions"><span>♡</span><span>○</span><span>➤</span><span class="save">♧</span></div>
  <div class="ig-caption"><b>agassist.ia</b> A dúvida aparece no campo. A conversa começa aqui.</div>
</div>
<div class="caption-preview">Prévia interativa. Use as setas do teclado ou arraste para navegar.</div>
</div>
<script>
  const viewport=document.querySelector('.carousel-viewport');
  const track=document.querySelector('.carousel-track');
  const dots=[...document.querySelectorAll('.ig-dots span')];
  let current=0,startX=null;
  function show(n){{current=Math.max(0,Math.min(4,n));track.style.transform=`translateX(${{-420*current}}px)`;dots.forEach((d,i)=>d.classList.toggle('active',i===current));}}
  viewport.addEventListener('pointerdown',e=>{{startX=e.clientX;viewport.setPointerCapture(e.pointerId)}});
  viewport.addEventListener('pointerup',e=>{{if(startX!==null){{const dx=e.clientX-startX;if(Math.abs(dx)>35)show(current+(dx<0?1:-1));startX=null}}}});
  document.addEventListener('keydown',e=>{{if(e.key==='ArrowRight')show(current+1);if(e.key==='ArrowLeft')show(current-1)}});
  dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));
</script></body></html>'''

(ROOT / "preview.html").write_text(html, encoding="utf-8")

caption = '''A dúvida aparece no meio da lida. E agora? 🌱

Uma folha diferente, um animal fora do padrão ou uma decisão de manejo: nem sempre dá para ter todas as respostas na hora. Mas dá para começar com as perguntas certas.

Essa é a ideia do AG Assist. Pela conversa com a Lida no WhatsApp, você poderá enviar texto, foto ou áudio e receber orientação prática sobre possíveis causas, o que observar, próximos passos seguros e quando chamar um profissional.

Estamos preparando o lançamento. Por aqui, vamos compartilhar situações reais do campo, notícias que importam, curiosidades e respostas para dúvidas frequentes.

Qual dúvida aparece com mais frequência na sua rotina? Conte nos comentários. 👇

Orientação por mensagem não substitui visita técnica, laudo ou receituário.

#AGAssist #Agro #ProdutorRural #LidaNoCampo #Agricultura #Pecuaria #ManejoNoCampo
'''
(ROOT / "legenda.txt").write_text(caption, encoding="utf-8")
print(ROOT / "preview.html")
