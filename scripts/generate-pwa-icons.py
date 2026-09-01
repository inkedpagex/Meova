import os
from PIL import Image, ImageDraw

def generate_icons():
    base_dir = r"e:\Main\projects\Meova\public"
    logo_path = os.path.join(base_dir, "logo.png")
    
    if not os.path.exists(logo_path):
        logo_path = os.path.join(base_dir, "icon-512.png")
        
    logo = Image.open(logo_path).convert("RGBA")
    
    # 1. Generate Crisp White Maskable Icons with Meova Orange Logo (centered in 72% safe zone)
    # Background: #ffffff, Logo: scaled and centered
    for size, filename in [
        (512, "icon-maskable-512.png"),
        (192, "icon-maskable-192.png"),
        (512, "icon-512.png"),
        (192, "icon-192.png"),
        (512, "icon.png"),
        (180, "apple-touch-icon.png")
    ]:
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        
        # Target logo dimensions: 70% of canvas size to fit within Android safe zone
        target_size = int(size * 0.70)
        
        # Maintain aspect ratio
        w_ratio = target_size / logo.width
        h_ratio = target_size / logo.height
        scale = min(w_ratio, h_ratio)
        
        new_w = int(logo.width * scale)
        new_h = int(logo.height * scale)
        
        resized_logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center the logo on the canvas
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        
        canvas.paste(resized_logo, (offset_x, offset_y), resized_logo)
        
        output_path = os.path.join(base_dir, filename)
        canvas.save(output_path, "PNG", optimize=True)
        print(f"Generated: {filename} ({size}x{size})")

    # 2. Generate Favicon (64x64 multi-layer ico)
    fav_canvas = Image.new("RGBA", (64, 64), (255, 255, 255, 255))
    target_fav = 48
    scale_fav = min(target_fav / logo.width, target_fav / logo.height)
    fav_w = int(logo.width * scale_fav)
    fav_h = int(logo.height * scale_fav)
    resized_fav = logo.resize((fav_w, fav_h), Image.Resampling.LANCZOS)
    fav_canvas.paste(resized_fav, ((64 - fav_w) // 2, (64 - fav_h) // 2), resized_fav)
    fav_canvas.save(os.path.join(base_dir, "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])
    print("Generated: favicon.ico")

if __name__ == "__main__":
    generate_icons()
