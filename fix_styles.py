import re

# 1. Update shared footer to remove LinkedIn icon
with open('js/shared-footer.js', 'r', encoding='utf-8') as f:
    text = f.read()

# remove Linkedin block:
linkedin_block = r'<a href="https://www\.linkedin\.com/company/pro-hands" target="_blank" rel="noopener" aria-label="LinkedIn">\s*<svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>\s*</a>'
text = re.sub(linkedin_block, '', text)

with open('js/shared-footer.js', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Fix animations.css to prevent inline-block
with open('css/animations.css', 'r', encoding='utf-8') as f:
    text2 = f.read()

text2 = re.sub(r'(\.footer__links a,\s*\.footer a\s*\{[^}]*)display:\s*inline-block;([^}]*\})', r'\1\2', text2)
with open('css/animations.css', 'w', encoding='utf-8') as f:
    f.write(text2)

# 3. Fix enhanced-3d.css to remove pill tags for hashtags (since he wants them exactly like original image 2)
with open('css/enhanced-3d.css', 'r', encoding='utf-8') as f:
    text3 = f.read()

text3 = re.sub(r'\.footer__hashtags span\s*\{[^}]*\}', '', text3)
text3 = re.sub(r'\.footer__hashtags span:hover\s*\{[^}]*\}', '', text3)

with open('css/enhanced-3d.css', 'w', encoding='utf-8') as f:
    f.write(text3)

print('All fixed')
