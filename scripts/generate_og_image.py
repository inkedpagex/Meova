import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_og_image():
    W, H = 1200, 630
    # Create high-end dark studio background with Meova brand orange glow
    img = Image.new('RGBA', (W, H), (14, 14, 18, 255))
    
    # Create glow overlay
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    
    # Orange radial glow on the left/center
    g_draw.ellipse([80, -50, 650, 520], fill=(240, 90, 0, 60))
    # Amber radial glow on bottom right
    g_draw.ellipse([700, 200, 1300, 800], fill=(245, 158, 11, 35))
    
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img, glow)
    
    draw = ImageDraw.Draw(img)
    
    # Load and composite Meova Logo/Icon
    logo_path = 'public/icon-512.png'
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert('RGBA')
        logo = logo.resize((180, 180), Image.Resampling.LANCZOS)
        
        # Rounded mask for logo
        mask = Image.new('L', (180, 180), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, 180, 180], radius=44, fill=255)
        
        # Shadow behind logo
        shadow = Image.new('RGBA', (210, 210), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.rounded_rectangle([5, 5, 205, 205], radius=50, fill=(240, 90, 0, 140))
        shadow = shadow.filter(ImageFilter.GaussianBlur(15))
        img.paste(shadow, (85, 205), shadow)
        
        img.paste(logo, (100, 220), mask)
    
    # Try loading Arial / Segoe UI / Trebuchet / sans-serif font
    font_bold_large = None
    font_bold_med = None
    font_sub = None
    font_tag = None
    
    for font_name in ['segoeuib.ttf', 'arialbd.ttf', 'HelveticaBold.ttf', 'DejaVuSans-Bold.ttf']:
        try:
            font_bold_large = ImageFont.truetype(font_name, 72)
            font_bold_med = ImageFont.truetype(font_name, 36)
            font_sub = ImageFont.truetype('segoeui.ttf' if 'segoe' in font_name else 'arial.ttf', 24)
            font_tag = ImageFont.truetype(font_name, 18)
            break
        except:
            continue
            
    if not font_bold_large:
        font_bold_large = ImageFont.load_default()
        font_bold_med = font_bold_large
        font_sub = font_bold_large
        font_tag = font_bold_large

    # Brand Title Text
    text_x = 320
    draw.text((text_x, 205), "Meova", font=font_bold_large, fill=(255, 255, 255, 255))
    
    # Campus Tag badge
    draw.rounded_rectangle([text_x + 240, 222, text_x + 470, 268], radius=14, fill=(240, 90, 0, 40), outline=(240, 90, 0, 180), width=2)
    draw.text((text_x + 258, 234), "GLA UNIVERSITY", font=font_tag, fill=(240, 140, 60, 255))
    
    # Sub-headline
    draw.text((text_x, 295), "Campus Social, Meetups & Gigs", font=font_bold_med, fill=(245, 245, 247, 255))
    
    # Secondary description
    draw.text((text_x, 355), "Connect with peers, book 1-on-1 coffee meets & join student circles.", font=font_sub, fill=(161, 161, 170, 255))
    
    # Feature Pills at bottom
    pills = [
        "☕ 1-on-1 Verified Meets",
        "🎯 Campus Circles",
        "⚡ Sparks Economy",
        "📸 Moments Feed"
    ]
    
    pill_x = 100
    pill_y = 490
    for p in pills:
        bbox = draw.textbbox((0, 0), p, font=font_tag)
        pw = bbox[2] - bbox[0] + 32
        draw.rounded_rectangle([pill_x, pill_y, pill_x + pw, pill_y + 44], radius=22, fill=(255, 255, 255, 18), outline=(255, 255, 255, 40), width=1)
        draw.text((pill_x + 16, pill_y + 12), p, font=font_tag, fill=(228, 228, 231, 255))
        pill_x += pw + 16
        
    # Top Domain Watermark
    draw.text((100, 100), "meova.in", font=font_tag, fill=(240, 90, 0, 220))
    draw.text((185, 100), "· GLA University Official Campus App", font=font_tag, fill=(113, 113, 122, 220))

    # Save to public directory
    os.makedirs('public', exist_ok=True)
    img_rgb = img.convert('RGB')
    img_rgb.save('public/og-image.png', quality=95, optimize=True)
    img_rgb.save('public/meova-og.png', quality=95, optimize=True)
    img_rgb.save('app/opengraph-image.png', quality=95, optimize=True)
    print("[OG-IMAGE] Successfully generated public/og-image.png and app/opengraph-image.png (1200x630)")

if __name__ == '__main__':
    create_og_image()
