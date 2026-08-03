#!/usr/bin/env python3
"""固定見出しをADS-strongでPNG化する。

ADS-strongはAdobe Fonts同期フォントのためWebフォント配信は不可。
画像化（デスクトップ用途）で使う。文言を変えたらこのスクリプトを再実行する。

usage: python3 tools/render_headings.py
"""
import sys
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

FONT = "/Users/shotanakagawa/Library/Application Support/Adobe/CoreSync/plugins/livetype/.r/.59696.otf"
SCALE = 3  # Retina用
OUT = "images/h"

DARK = (45, 41, 38, 255)
WHITE = (255, 255, 255, 255)

HEADINGS = [
    ("title",     "機器接続サポート",                    26, WHITE),
    ("step1",     "お使いのスマホ・タブレット・パソコンは？", 19, DARK),
    ("step2",     "お使いのキーボード・電子ピアノは？",      19, DARK),
    ("step3",     "接続方法",                            19, DARK),
    ("cta",       "この内容でトークに相談する",             18, WHITE),
    ("gate",      "LINEアプリからご利用ください",           19, DARK),
    ("agree",     "ご利用の前に",                        19, DARK),
]


def check_glyphs():
    """ADS-strongは表示用フォントで漢字カバレッジが限定的。
    未収録文字は無言で空白になるため、描画前に必ず検査する（例: 「鍵盤」は未収録）。"""
    f = TTFont(FONT)
    cmap = set()
    for t in f["cmap"].tables:
        cmap |= set(t.cmap.keys())
    ng = False
    for name, text, _, _ in HEADINGS:
        miss = "".join(c for c in text if ord(c) not in cmap)
        if miss:
            print(f"NG {name}: フォント未収録の文字 → 「{miss}」", file=sys.stderr)
            ng = True
    if ng:
        print("文言を変えるか、該当見出しは画像化しないでください。", file=sys.stderr)
        sys.exit(1)


def render(name, text, size, color):
    font = ImageFont.truetype(FONT, size * SCALE)
    tmp = Image.new("RGBA", (10, 10))
    box = ImageDraw.Draw(tmp).textbbox((0, 0), text, font=font)
    pad = 4 * SCALE
    img = Image.new("RGBA", (box[2] - box[0] + pad * 2, box[3] - box[1] + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((pad - box[0], pad - box[1]), text, font=font, fill=color)
    path = f"{OUT}-{name}.png"
    img.save(path)
    # CSSで指定する表示サイズ（論理px）
    print(f"{path}  {img.width // SCALE}x{img.height // SCALE}")


if __name__ == "__main__":
    check_glyphs()
    for args in HEADINGS:
        render(*args)
