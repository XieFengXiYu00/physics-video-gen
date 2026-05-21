"""
人像处理脚本：
  1. 使用 rembg 去除背景，输出透明 PNG
  2. （可选）添加黑色描边
  3. 保存到指定路径

用法:
  python3 process_portrait.py <input> <output> [--outline N]

注意: 描边在 tsx 里用 CSS filter:drop-shadow 完成，这里只输出去背景后的透明 PNG。
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageFilter
from rembg import remove, new_session


def process(input_path: Path, output_path: Path, outline: int = 0, model: str = "u2netp") -> None:
    print(f"[process_portrait] 输入: {input_path}")
    print(f"[process_portrait] 输出: {output_path}")
    print(f"[process_portrait] 模型: {model}")

    with open(input_path, "rb") as f:
        data = f.read()

    print("[process_portrait] 正在去除背景...")
    session = new_session(model)
    result_bytes = remove(data, session=session)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(result_bytes)
    img = Image.open(output_path).convert("RGBA")

    if outline > 0:
        print(f"[process_portrait] 添加黑色描边: {outline}px")
        alpha = img.split()[3]
        dilated = alpha.filter(ImageFilter.MaxFilter(outline * 2 + 1))
        outline_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        outline_layer.putalpha(dilated)
        outline_only = Image.new("RGBA", img.size, (0, 0, 0, 255))
        outline_only.putalpha(dilated)
        composed = Image.alpha_composite(outline_only, img)
        composed.save(output_path)
    else:
        img.save(output_path)

    final = Image.open(output_path)
    print(f"[process_portrait] 完成。尺寸: {final.size}, 模式: {final.mode}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--outline", type=int, default=0, help="描边粗细(像素), 0 表示不加")
    parser.add_argument("--model", default="u2netp", help="rembg 模型: u2net|u2netp|isnet-general-use")
    args = parser.parse_args()
    try:
        process(Path(args.input), Path(args.output), args.outline, args.model)
    except Exception as e:
        print(f"[process_portrait] 错误: {e}", file=sys.stderr)
        sys.exit(1)
