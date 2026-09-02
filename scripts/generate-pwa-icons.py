import os
from PIL import Image

def generate_icons():
    base_dir = r"e:\Main\projects\Meova\public"
    app_dir = r"e:\Main\projects\Meova\app"
    logo_path = os.path.join(base_dir, "logo.png")
    
    if not os.path.exists(logo_path):
        logo_path = os.path.join(base_dir, "icon-512.png")
        
    logo = Image.open(logo_path).convert("RGBA")
    
    # 1. Generate Crisp White Maskable Icons for Mobile Home Screen (Android PWA + iPhone Home Screen)
    # Background: #ffffff (solid white), Logo: scaled and centered in 72% safe zone
    for size, filename in [
        (512, "icon-maskable-512.png"),
        (192, "icon-maskable-192.png"),
        (180, "apple-touch-icon.png")
    ]:
        canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255)) # Clean White for mobile app icon
        target_size = int(size * 0.72)
        scale = min(target_size / logo.width, target_size / logo.height)
        new_w = int(logo.width * scale)
        new_h = int(logo.height * scale)
        resized_logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        canvas.paste(resized_logo, (offset_x, offset_y), resized_logo)
        
        output_path = os.path.join(base_dir, filename)
        canvas.save(output_path, "PNG", optimize=True)
        print(f"Generated Mobile App Launcher: {filename} ({size}x{size}) [White Background]")

    # 2. Generate Transparent PNG Icons for Browser Tabs & Favicons
    for size, filename in [
        (512, "icon-512.png"),
        (192, "icon-192.png"),
        (512, "icon.png"),
    ]:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0)) # Fully transparent for browser tabs
        target_size = int(size * 0.90)
        scale = min(target_size / logo.width, target_size / logo.height)
        new_w = int(logo.width * scale)
        new_h = int(logo.height * scale)
        resized_logo = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        canvas.paste(resized_logo, (offset_x, offset_y), resized_logo)
        
        output_path = os.path.join(base_dir, filename)
        canvas.save(output_path, "PNG", optimize=True)
        print(f"Generated Browser Tab Icon: {filename} ({size}x{size}) [Transparent]")

    # Also save transparent icon.png to app/icon.png
    app_icon_canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    app_target = int(512 * 0.90)
    scale_app = min(app_target / logo.width, app_target / logo.height)
    app_w = int(logo.width * scale_app)
    app_h = int(logo.height * scale_app)
    resized_app = logo.resize((app_w, app_h), Image.Resampling.LANCZOS)
    app_icon_canvas.paste(resized_app, ((512 - app_w) // 2, (512 - app_h) // 2), resized_app)
    app_icon_canvas.save(os.path.join(app_dir, "icon.png"), "PNG", optimize=True)
    print("Generated: app/icon.png [Transparent]")

    # 3. Generate Transparent Favicon (ICO multi-layer)
    fav_canvas = Image.new("RGBA", (64, 64), (0, 0, 0, 0)) # Fully transparent
    target_fav = 58
    scale_fav = min(target_fav / logo.width, target_fav / logo.height)
    fav_w = int(logo.width * scale_fav)
    fav_h = int(logo.height * scale_fav)
    resized_fav = logo.resize((fav_w, fav_h), Image.Resampling.LANCZOS)
    fav_canvas.paste(resized_fav, ((64 - fav_w) // 2, (64 - fav_h) // 2), resized_fav)
    fav_canvas.save(os.path.join(base_dir, "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])
    print("Generated: favicon.ico [Transparent]")

if __name__ == "__main__":
    generate_icons()
