#!/usr/bin/env python3
"""
Update Django template with Vite build output references.
This script parses Vite's generated index.html and updates Django's template/index.html
with the correct asset references.
"""

import os
import re
import sys
from pathlib import Path

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent
VITE_INDEX_HTML = PROJECT_ROOT / "frontend" / "dist" / "index.html"
DJANGO_TEMPLATE = PROJECT_ROOT / "templates" / "index.html"


def extract_assets_from_vite_html(vite_html_path):
    """Extract JS and CSS asset references from Vite's generated index.html"""
    if not vite_html_path.exists():
        print(f"❌ Error: {vite_html_path} not found!")
        print("   Run 'npm run build' in the frontend directory first.")
        sys.exit(1)
    
    with open(vite_html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract script tag
    script_match = re.search(r'<script[^>]+src="([^"]+)"', content)
    js_file = script_match.group(1) if script_match else None
    
    # Extract stylesheet link
    css_match = re.search(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', content)
    css_file = css_match.group(1) if css_match else None
    
    if not js_file:
        print("❌ Error: Could not find script tag in Vite's index.html")
        sys.exit(1)
    
    # Remove leading /static/ if present (Django static will add it)
    # Vite now uses base: "/static/" so paths will be /static/assets/...
    js_file = js_file.replace('/static/', '').lstrip('/')
    css_file = css_file.replace('/static/', '').lstrip('/') if css_file else None
    
    return js_file, css_file


def update_django_template(template_path, js_file, css_file):
    """Update Django template with new asset references"""
    if not template_path.exists():
        print(f"❌ Error: {template_path} not found!")
        sys.exit(1)
    
    with open(template_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update script tag
    script_pattern = r'<script[^>]+src="{% static \'[^\']+\' %}"'
    script_replacement = f'<script type="module" crossorigin src="{{% static \'{js_file}\' %}}"></script>'
    content = re.sub(script_pattern, script_replacement, content)
    
    # Update stylesheet link
    if css_file:
        css_pattern = r'<link[^>]+rel="stylesheet"[^>]+href="{% static \'[^\']+\' %}"'
        css_replacement = f'<link rel="stylesheet" crossorigin href="{{% static \'{css_file}\' %}}">'
        content = re.sub(css_pattern, css_replacement, content)
    
    with open(template_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated {template_path}")
    print(f"   JS: {js_file}")
    if css_file:
        print(f"   CSS: {css_file}")


def main():
    print("Updating Django template with Vite build references...")
    print("=" * 60)
    
    js_file, css_file = extract_assets_from_vite_html(VITE_INDEX_HTML)
    update_django_template(DJANGO_TEMPLATE, js_file, css_file)
    
    print("=" * 60)
    print("✅ Template updated successfully!")


if __name__ == "__main__":
    main()

