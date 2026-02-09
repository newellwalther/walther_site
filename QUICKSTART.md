# QUICK START GUIDE

## What's Been Updated

✅ **New Pages Created:**
- paintings.html - Full gallery system with series, lightbox, zoom
- drawings.html - Gallery + game at bottom
- text.html - Video layout (1 top, 2 bottom offset)
- links.html - Linktree replacement (not in menu)
- contact.html - Contact form + newsletter signup
- 404.html - Custom error page with smashed window

✅ **New Systems:**
- Gallery JavaScript (gallery.js) - Handles all image galleries
- Gallery CSS (gallery.css) - All gallery styling
- Data files (paintings-data.json, drawings-data.json)

✅ **Infrastructure:**
- Google Analytics installed (G-6XGRYTSC23)
- Favicon (yin yang emoji) on all pages
- SEO meta tags on main pages
- sitemap.xml for Google
- robots.txt (hides links.html from search)
- feed.xml (RSS feed for updates)
- README.md (full documentation)

✅ **Updates to Existing Pages:**
- index.html - Analytics, favicon, updated menu
- exhibitions.html - New shows added, updated menu/footer
- contact.html - Rebuilt with forms
- All pages - Georgia serif font, consistent menus, newsletter links

## IMMEDIATE NEXT STEPS

### 1. Add Your Images to R2

You need to upload actual images to your Cloudflare R2 bucket. Currently the gallery references placeholder filenames.

**Where:** Cloudflare R2 bucket `100-paintings`  
**What to upload:** Your painting/drawing JPGs  
**Naming:** Use simple, descriptive names like `blue-study-2025.jpg`

### 2. Update JSON Data Files

Edit these files with your actual artwork info:

**paintings-data.json:**
```json
{
  "series": [
    {
      "title": "YOUR SERIES NAME",
      "subtitle": "Medium, Year",
      "images": [
        {
          "filename": "actual-filename-in-r2.jpg",
          "title": "Actual Title",
          "year": "2025",
          "medium": "Oil on canvas"
        }
      ]
    }
  ]
}
```

**drawings-data.json:** Same structure

### 3. Update Text Page Videos

Edit `text.html` and replace:
- `YOUR_VIDEO_ID` with actual YouTube/Vimeo IDs
- Video titles
- Descriptions

### 4. Test Locally

```bash
cd /path/to/walther_site
python3 -m http.server 8000
# Visit http://localhost:8000
```

Click through everything:
- ✓ Menu works on all pages
- ✓ Gallery loads
- ✓ Lightbox opens/closes
- ✓ Forms work (will open email client)
- ✓ Mobile responsive

### 5. Deploy to Cloudflare

```bash
git add .
git commit -m "Major site update - new gallery system"
git push
```

Cloudflare Pages will auto-deploy in ~1 minute.

## IMPORTANT NOTES

### About R2 Image URLs
The gallery currently uses:
```
https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/100-paintings/
```

Verify this is your correct R2 public URL. If different, update in `gallery.js` (line 55 and 191).

### Menu Order (Now Standardized)
All pages now have same menu order:
1. Home
2. Paintings
3. Drawings
4. Text
5. Exhibitions / CV
6. Video
7. Manhattan Art Comic (external link)
8. About
9. Contact

### Hidden Features Ready to Enable

**Language Toggle:**
Infrastructure is in place but hidden. When ready for translations, update the code to show language selector.

**Newsletter Integration:**
Currently uses mailto:. When ready for proper mailing list:
1. Sign up for service (Mailchimp, ConvertKit, etc.)
2. Update form action in contact.html
3. Or keep simple - forms currently email you subscriber info

## Files You'll Edit Most Often

1. **paintings-data.json** - Add new paintings
2. **drawings-data.json** - Add new drawings  
3. **text.html** - Update videos
4. **exhibitions.html** - Add exhibitions
5. **feed.xml** - Announce new work (RSS)

## Quick Fixes

**Gallery not showing images?**
- Check R2 filenames match JSON exactly (case-sensitive!)
- Check R2 bucket URL in gallery.js
- View browser console for errors (F12)

**Menu broken?**
- Ensure `<script src="menu.js"></script>` at bottom of page

**Forms not working?**
- They use mailto: - will open email client
- This is intentional until you set up actual form backend

## Support

Read the full README.md for detailed documentation.

For questions: newell.pdx@gmail.com

---

**You're all set!** Just add your images and update the data files. The system will handle the rest.
