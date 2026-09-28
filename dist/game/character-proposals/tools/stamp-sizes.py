# Write each shot's real pixel size onto its <img> in index.html, so lazy images never shift the page
# (and nav anchors land where they should). Run after capture.mjs.
import re, struct, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
def size(p):
    b = (root / p).read_bytes()[16:24]; return struct.unpack('>II', b)
def fix(m):
    tag = m.group(0); src = re.search(r'src="([^"]+\.png)"', tag).group(1)
    w, h = size(src); tag = re.sub(r'\s(width|height)="\d+"', '', tag)
    return tag.replace('<img ', f'<img width="{w}" height="{h}" ', 1)
html = re.sub(r'<img [^>]*src="shots/[^"]+\.png"[^>]*>', fix, html)
(root / 'index.html').write_text(html)
print('stamped', len(re.findall(r'<img [^>]*src="shots/', html)), 'images')
