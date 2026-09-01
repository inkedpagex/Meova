import os
from PIL import Image

def generate_badge():
    base_dir = r"e:\Main\projects\Meova\public"
    logo_path = os.path.join(base_dir, "logo.png")
    if not os.path.exists(logo_path):
        logo_path = os.path.join(base_dir, "icon-512.png")
        
    logo = Image.open(logo_path).convert("RGBA")
    
    # 1. Create a 96x96 transparent canvas
    size = 96
    badge = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    
    # Scale logo to fit nicely in 76x76
    target_size = 76
    scale = min(target_size / logo.width, target_size / logo.height)
    new_w = int(logo.width * scale)
    new_h = int(logo.height * scale)
    
    resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Convert all non-transparent pixels to solid white with their original alpha
    r, g, b, a = resized.split()
    white_img = Image.new("RGB", resized.size, (255, 255, 255))
    mono_logo = Image.merge("RGBA", (*white_img.split(), a))
    
    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    badge.paste(mono_logo, (offset_x, offset_y), mono_logo)
    
    output_path = os.path.join(base_dir, "badge.png")
    badge.save(output_path, "PNG", optimize=True)
    print("Generated: badge.png (96x96 monochrome silhouette)")

    # 2. Also generate rich notification icons (192x192 rounded squircle with subtle orange background)
    notif_icon = Image.new("RGBA", (192, 192), (240, 90, 0, 255))
    # Make white logo on orange background
    target_notif_size = 136
    scale_notif = min(target_notif_size / logo.width, target_notif_size / logo.height)
    notif_w = int(logo.width * scale_notif)
    notif_h = int(logo.height * scale_notif)
    resized_notif = logo.resize((notif_w, notif_h), Image.Resampling.LANCZOS)
    r2, g2, b2, a2 = resized_notif.split()
    white_notif = Image.new("RGB", resized_notif.size, (255, 255, 255))
    white_logo = Image.merge("RGBA", (*white_notif.split(), a2))
    
    notif_icon.paste(white_logo, ((192 - notif_w) // 2, (192 - notif_h) // 2), white_logo)
    notif_icon.save(os.path.join(base_dir, "notif-icon.png"), "PNG", optimize=True)
    print("Generated: notif-icon.png (192x192 rich notification icon)")

if __name__ == "__main__":
    generate_badge()
