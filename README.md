# Walther.website - Site Documentation

## Overview
Static artist website for Andrew Newell Walther. Built with vanilla HTML, CSS, and JavaScript for simplicity, durability, and low maintenance.

## Tech Stack
- **Frontend**: HTML5, CSS3, vanilla JavaScript
- **Hosting**: Cloudflare Pages
- **Images**: Cloudflare R2 (external storage)
- **Version Control**: Git + GitHub
- **Editor**: VS Code (or any text editor)

## File Structure

```
walther_site/
├── index.html              # Homepage with rotating globe
├── paintings.html          # Paintings gallery
├── drawings.html           # Drawings gallery + game
├── text.html              # Text works with videos
├── exhibitions.html       # Exhibitions / CV
├── video.html             # Video works
├── about.html             # About/bio
├── contact.html           # Contact + newsletter forms
├── links.html             # Linktree replacement (not in menu)
├── 404.html               # Custom error page
├── style.css              # Main stylesheet
├── gallery.css            # Gallery-specific styles
├── menu.js                # Dropdown menu functionality
├── gallery.js             # Gallery system with lightbox
├── paintings-data.json    # Paintings gallery data
├── drawings-data.json     # Drawings gallery data
├── sitemap.xml           # SEO sitemap
├── robots.txt            # Search engine rules
├── feed.xml              # RSS feed
├── images/               # Local images (logo, etc.)
└── qr/                   # QR codes folder
```

## How to Update Your Site

### Adding New Paintings

1. Upload images to Cloudflare R2 bucket: `100-paintings`
2. Edit `paintings-data.json`:

```json
{
  "series": [
    {
      "title": "New Series Name",
      "subtitle": "Oil on canvas, 2026",
      "images": [
        {
          "filename": "your-image.jpg",
          "title": "Work Title",
          "year": "2026",
          "medium": "Oil on canvas",
          "series": "Optional series name",
          "collection": "Optional collection info"
        }
      ]
    }
  ]
}
```

3. Save and upload to Cloudflare Pages
4. Site updates automatically

### Adding New Drawings

Same process as paintings, but edit `drawings-data.json` instead.

### Adding New Exhibitions

Edit `exhibitions.html` directly:

```html
<div class="exhibition">
  <strong>Exhibition Title</strong>
  Artist names<br/>
  Gallery Name, City, Country<br/>
  Date
</div>
```

### Adding New Videos to Text Page

Edit `text.html`:

1. Replace `YOUR_VIDEO_ID` with actual YouTube/Vimeo ID
2. Update titles and descriptions
3. To add/remove videos, copy/paste the `<section class="video-section">` blocks

### Updating RSS Feed

When you add new work, update `feed.xml`:

```xml
<item>
  <title>New Series: [Name]</title>
  <link>https://walther.website/paintings.html</link>
  <description>Brief description of new work</description>
  <pubDate>Day, DD Mon YYYY 00:00:00 GMT</pubDate>
</item>
```

## Image Management

### R2 Bucket Structure
- Base URL: `https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/100-paintings/`
- Upload images with descriptive filenames
- Recommended size: Under 500KB per image (web-optimized)
- Format: JPG for photos, PNG for graphics

### Image Optimization Tips
1. Resize to max 2000px on longest side
2. Export at 75-85% quality
3. Use tools like ImageOptim, TinyPNG, or Photoshop "Save for Web"

## Deployment

### Initial Setup (Already Done)
1. GitHub repository connected to Cloudflare Pages
2. Auto-deploys on push to main branch
3. Custom domain: walther.website

### Updating the Site
```bash
# Make your changes locally
# Then:
git add .
git commit -m "Update paintings gallery"
git push

# Cloudflare Pages auto-deploys in ~1 minute
```

## Key Features

### Gallery System
- Series-based organization
- Horizontal scrolling rows
- Lightbox with zoom
- Keyboard navigation (← → ↑ ↓ keys)
- Mobile swipe support
- Lazy loading
- Right-click protection

### List View Toggle
- Click "List View" button (top right)
- Vertical layout for browsing
- Fades in text on scroll

### Newsletter/Contact Forms
- Currently use mailto: (opens email client)
- Data saved locally by user
- Future: Can integrate Mailchimp, ConvertKit, etc.

### SEO & Analytics
- Google Analytics: G-6XGRYTSC23
- Sitemap auto-included
- Meta tags on all pages
- RSS feed for updates

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-optimized
- No IE support (uses modern CSS/JS)

## Performance
- Target: 3-5 second load time
- Lazy loading images
- Minimal JavaScript
- No external frameworks

## Troubleshooting

### Menu Not Working
- Check that `menu.js` is included in `<script>` tag at bottom of page
- Verify menu structure matches other pages

### Gallery Not Loading
- Check JSON file syntax (use JSONLint.com)
- Verify R2 image URLs are correct
- Check browser console for errors

### Images Not Appearing
- Confirm images uploaded to R2
- Check filename matches exactly (case-sensitive)
- Verify R2 bucket is public

## Future Enhancements

### Planned
- Language toggle (infrastructure in place, hidden)
- Actual newsletter service integration
- More sophisticated contact form backend

### Possible
- Search functionality
- Image comments/annotations
- Archive/timeline view

## Contact

For issues or questions about this site:
- Email: newell.pdx@gmail.com
- Or use the contact form on the site

## Credits

- Built: February 2026
- Design: Andrew Newell Walther
- Development: Custom static site

---

## Quick Reference Commands

### Start local server (to preview changes):
```bash
# Python 3
python3 -m http.server 8000

# Then visit: http://localhost:8000
```

### Add new work:
1. Edit JSON file
2. `git add . && git commit -m "Add new paintings" && git push`

### Update exhibition:
1. Edit `exhibitions.html`
2. `git add . && git commit -m "Add new exhibition" && git push`

That's it! Keep it simple, keep it clean.
