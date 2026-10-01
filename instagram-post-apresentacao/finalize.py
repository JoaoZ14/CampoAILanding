from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from PIL import Image


root = Path(__file__).resolve().parent
slides = sorted((root / "slides").glob("slide-*.png"))
if len(slides) != 5:
    raise SystemExit(f"Expected 5 slides, found {len(slides)}")

contact = Image.new("RGB", (1664, 400), "#e9e9e2")
for index, path in enumerate(slides):
    with Image.open(path) as image:
        if image.width != 1080 or image.height < 1350:
            raise SystemExit(f"Unexpected size for {path.name}: {image.size}")
        if image.height != 1350:
            image = image.crop((0, 0, 1080, 1350))
            image.save(path)
        contact.paste(image.convert("RGB").resize((320, 400)), (index * 336, 0))
        print(f"{path.name}: {image.size}")

contact.save(root / "contato.jpg", quality=90)
with ZipFile(root / "AG-Assist-post-apresentacao.zip", "w", ZIP_DEFLATED) as archive:
    for path in slides:
        archive.write(path, path.name)
    archive.write(root / "legenda.txt", "legenda.txt")
