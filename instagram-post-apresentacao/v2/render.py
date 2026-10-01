from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parent
LANDING = ROOT.parent.parent
PHOTOS = LANDING / "instagram-carrossel-mancha" / "assets"
ASSETS = LANDING / "assets"
OUT = ROOT / "slides"
OUT.mkdir(exist_ok=True)

W, H = 1080, 1350
INK = (20, 48, 38)
DEEP = (10, 34, 26)
CREAM = (246, 242, 227)
PALE = (222, 233, 197)
TERRA = (179, 116, 77)
MUTED = (91, 108, 92)

FONTS = Path("C:/Windows/Fonts")


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


def photo(name: str, focus=(0.5, 0.5)) -> Image.Image:
    im = Image.open(PHOTOS / name).convert("RGB")
    im = ImageOps.fit(im, (W, H), method=Image.Resampling.LANCZOS, centering=focus)
    return ImageEnhance.Color(im).enhance(0.82)


def vertical_overlay(im: Image.Image, top, bottom):
    gradient = Image.new("RGBA", (1, H))
    pixels = []
    for y in range(H):
        t = y / (H - 1)
        pixels.append(tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(4)))
    gradient.putdata(pixels)
    im = Image.alpha_composite(im.convert("RGBA"), gradient.resize((W, H)))
    return im.convert("RGB")


def texture(im: Image.Image, opacity=0.045):
    noise = Image.effect_noise((W, H), 35).convert("L")
    paper = Image.new("RGB", (W, H), CREAM)
    paper.putalpha(noise.point(lambda n: int(opacity * n)))
    return Image.alpha_composite(im.convert("RGBA"), paper).convert("RGB")


def mark(im: Image.Image, x: int, y: int, color=CREAM, size=56):
    raw = Image.open(ASSETS / "Logo CampoLead (1)-Photoroom.png").convert("RGBA")
    bbox = raw.getchannel("A").getbbox()
    raw = raw.crop(bbox)
    raw.thumbnail((size, size), Image.Resampling.LANCZOS)
    colored = Image.new("RGBA", raw.size, (*color, 0))
    colored.putalpha(raw.getchannel("A"))
    im.paste(colored, (x, y), colored)


def text(im, xy, value, face, size, fill, spacing=0, stroke=0, stroke_fill=None):
    draw = ImageDraw.Draw(im)
    draw.multiline_text(xy, value, font=font(face, size), fill=fill,
                        spacing=spacing, stroke_width=stroke, stroke_fill=stroke_fill)


def label(im, xy, value, color=CREAM, size=28, tracking=5):
    draw = ImageDraw.Draw(im)
    f = font("bahnschrift.ttf", size)
    x, y = xy
    for char in value.upper():
        draw.text((x, y), char, font=f, fill=color)
        x += draw.textlength(char, font=f) + tracking


def line(im, points, color, width=3):
    ImageDraw.Draw(im).line(points, fill=color, width=width)


def save(im: Image.Image, n: int):
    path = OUT / f"slide-{n:02d}.png"
    im.save(path, optimize=True)
    print(path.name, im.size)


# 01 — photographic hook. The words occupy the crop like an editorial cover.
im = photo("campo-linhas.jpg")
im = vertical_overlay(im, (6, 28, 22, 120), (5, 25, 17, 220))
im = texture(im, 0.035)
mark(im, 78, 76, CREAM, 61)
label(im, (152, 94), "AG ASSIST", CREAM, 31, 4)
label(im, (78, 393), "A VIDA REAL NO CAMPO", PALE, 26, 5)
text(im, (72, 500), "A dúvida", "georgiab.ttf", 129, CREAM)
text(im, (72, 642), "não espera", "georgiab.ttf", 121, CREAM)
text(im, (72, 787), "o fim da lida.", "georgiai.ttf", 111, PALE)
line(im, [(78, 1105), (207, 1105)], TERRA, 7)
text(im, (78, 1141), "Uma conversa começa com\no que você observou.", "constan.ttf", 43, CREAM, 8)
label(im, (78, 1290), "01   /   05", PALE, 20, 3)
save(im, 1)


# 02 — observed detail, then a paper-like field note.
im = photo("irrigacao.jpg", (0.5, 0.34))
im = vertical_overlay(im, (7, 30, 18, 90), (9, 39, 24, 125))
draw = ImageDraw.Draw(im)
draw.rectangle((0, 785, W, H), fill=CREAM)
line(im, [(78, 851), (1003, 851)], TERRA, 5)
label(im, (80, 89), "NO MEIO DA LIDA", CREAM, 26, 5)
text(im, (71, 476), "Uma folha\ndiferente.", "georgiab.ttf", 111, CREAM, -3)
text(im, (75, 887), "E agora?", "georgiai.ttf", 122, INK)
text(im, (80, 1046), "Antes de agir, entenda melhor\no que está acontecendo.", "constan.ttf", 48, INK, 4)
label(im, (80, 1268), "CADA DETALHE CONTA", MUTED, 22, 3)
save(texture(im, 0.026), 2)


# 03 — typographic reveal with a quiet botanical watermark.
im = Image.new("RGB", (W, H), DEEP)
mark(im, 640, 295, (57, 93, 69), 500)
im = texture(im, 0.018)
label(im, (77, 89), "AG ASSIST APRESENTA", PALE, 25, 5)
line(im, [(77, 146), (1002, 146)], (98, 123, 100), 3)
text(im, (61, 390), "Lida.", "georgiai.ttf", 264, CREAM)
line(im, [(78, 690), (354, 690)], TERRA, 7)
text(im, (77, 769), "A assistente para\ndúvidas do campo,\nno WhatsApp.", "constan.ttf", 70, CREAM, 10)
label(im, (78, 1264), "TEXTO   /   FOTO   /   ÁUDIO", PALE, 23, 4)
save(im, 3)


# 04 — a magazine spread, not a product UI.
im = Image.new("RGB", (W, H), CREAM)
crop = photo("campo-sol.jpg", (0.58, 0.50)).crop((0, 0, 425, H))
crop = ImageEnhance.Color(crop).enhance(0.70)
im.paste(crop, (655, 0))
line(im, [(655, 0), (655, H)], TERRA, 7)
label(im, (76, 96), "CONVERSE DO SEU JEITO", INK, 23, 3)
text(im, (71, 276), "Foto.", "georgiab.ttf", 132, INK)
text(im, (71, 435), "Áudio.", "georgiab.ttf", 132, INK)
text(im, (71, 594), "Texto.", "georgiab.ttf", 132, INK)
line(im, [(77, 806), (561, 806)], TERRA, 6)
text(im, (77, 872), "A Lida ajuda a\norganizar a dúvida\ne pensar o próximo\npasso seguro.", "constan.ttf", 54, INK, 7)
label(im, (77, 1263), "ORIENTAÇÃO POR MENSAGEM", MUTED, 20, 3)
save(texture(im, 0.024), 4)


# 05 — simple follow CTA with no button, card, or mock phone.
im = photo("campo-linhas.jpg", (0.5, 0.62))
im = vertical_overlay(im, (5, 25, 19, 175), (4, 25, 16, 230))
im = texture(im, 0.03)
mark(im, 78, 75, CREAM, 61)
label(im, (152, 93), "AG ASSIST", CREAM, 31, 4)
label(im, (77, 371), "EM BREVE", PALE, 30, 7)
text(im, (70, 468), "O campo\nsegue.", "georgiab.ttf", 127, CREAM, -8)
text(im, (72, 745), "A conversa\ntambém.", "georgiai.ttf", 115, PALE, -8)
line(im, [(78, 1109), (1002, 1109)], (195, 215, 187), 3)
label(im, (78, 1152), "SIGA E ACOMPANHE", CREAM, 23, 4)
text(im, (77, 1203), "@agassist.ia", "georgiab.ttf", 55, CREAM)
save(im, 5)


contact = Image.new("RGB", (5 * 270 + 4 * 14, 338), "#d9d9d1")
for i, path in enumerate(sorted(OUT.glob("slide-*.png"))):
    with Image.open(path) as slide:
        contact.paste(slide.resize((270, 338), Image.Resampling.LANCZOS), (i * 284, 0))
contact.save(ROOT / "contato.jpg", quality=92)

with ZipFile(ROOT / "AG-Assist-post-editorial.zip", "w", ZIP_DEFLATED) as archive:
    for path in sorted(OUT.glob("slide-*.png")):
        archive.write(path, path.name)
    archive.write(ROOT / "legenda.txt", "legenda.txt")
