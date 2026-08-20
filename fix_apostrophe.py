path = r'e:\Main\projects\Meetify\features\users\BookCoffeeButton.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = "You\u2019ll receive a slot confirmation"
new = "You&apos;ll receive a slot confirmation"

# Try both straight and curly apostrophe
content2 = content.replace("You'll receive a slot confirmation", "You&apos;ll receive a slot confirmation")
with open(path, 'w', encoding='utf-8') as f:
    f.write(content2)

print("Done. Changes made:", content != content2)
