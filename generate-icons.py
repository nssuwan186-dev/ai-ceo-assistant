#!/usr/bin/env python3
"""Generate app icons for Android adaptive launcher icon."""
from PIL import Image, ImageDraw, ImageFont
import os

# Icon sizes for Android
SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RES_DIR = os.path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'res')

def create_icon(size, output_path, is_foreground=False):
    """Create a single icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if is_foreground:
        # White house icon on transparent background
        # Background circle
        margin = size // 8
        radius = (size - margin * 2) // 2
        cx, cy = size // 2, size // 2
        
        # Draw house shape
        house_w = size * 0.6
        house_h = size * 0.45
        roof_h = size * 0.2
        x = (size - house_w) // 2
        y = size // 2 - house_h // 2 + roof_h // 3

        # Roof (triangle)
        roof_points = [
            (size // 2, y - roof_h // 2),
            (x - size * 0.05, y),
            (x + house_w + size * 0.05, y),
        ]
        draw.polygon(roof_points, fill='white')

        # House body (rectangle)
        body_x = x
        body_y = y
        draw.rectangle([body_x, body_y, body_x + house_w, body_y + house_h], fill='white')

        # Door
        door_w = size * 0.12
        door_h = size * 0.2
        door_x = (size - door_w) // 2
        door_y = body_y + house_h - door_h
        draw.rectangle([door_x, door_y, door_x + door_w, door_y + door_h], fill=(0, 0, 0, 0))
        
    else:
        # Gradient background: indigo-600 to purple-600
        for y in range(size):
            # Interpolate from #4f46e5 (indigo-600) to #9333ea (purple-600)
            r = int(79 + (147 - 79) * y / size)
            g = int(70 + (51 - 70) * y / size)
            b = int(229 + (234 - 229) * y / size)
            draw.line([(0, y), (size, y)], fill=(r, g, b))

        # White house icon
        margin = size // 8
        house_w = size * 0.55
        house_h = size * 0.4
        roof_h = size * 0.2
        y_start = size // 2 - house_h // 2 + roof_h // 3

        # Roof
        roof_points = [
            (size // 2, y_start - roof_h // 2),
            ((size - house_w) // 2 - size * 0.04, y_start),
            ((size + house_w) // 2 + size * 0.04, y_start),
        ]
        draw.polygon(roof_points, fill='white')

        # Body
        bx = (size - house_w) // 2
        draw.rectangle([bx, y_start, bx + house_w, y_start + house_h], fill='white')

        # Door cutout (transparent)
        door_w = size * 0.1
        door_h = size * 0.18
        door_x = (size - door_w) // 2
        door_y = y_start + house_h - door_h
        draw.rectangle([door_x, door_y, door_x + door_w, door_y + door_h], fill=(79, 70, 229))

    img.save(output_path, 'PNG')
    print(f"  ✓ {output_path} ({size}x{size})")


def main():
    for density, size in SIZES.items():
        folder = f'mipmap-{density}'
        path = os.path.join(RES_DIR, folder)
        os.makedirs(path, exist_ok=True)

        # Background
        create_icon(size, os.path.join(path, 'ic_launcher_background.png'), is_foreground=False)
        # Foreground
        create_icon(size, os.path.join(path, 'ic_launcher_foreground.png'), is_foreground=True)
        # Full icon (for round)
        create_icon(size, os.path.join(path, 'ic_launcher_round.png'), is_foreground=False)
        # Full icon (for non-adaptive)
        create_icon(size, os.path.join(path, 'ic_launcher.png'), is_foreground=False)

    # Play store icon (512x512)
    create_icon(512, os.path.join(RES_DIR, 'mipmap-xxxhdpi', 'ic_launcher_playstore.png'))

    print("\n✅ All icons generated!")


if __name__ == '__main__':
    main()
