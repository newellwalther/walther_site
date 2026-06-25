# walther.website — Architecture

This describes the site **as it actually is in the code right now**, verified
directly against the repo and the live site. There is an older
`WALTHER-WEBSITE-COMPLETE-DOCUMENTATION.md` in this repo (4 sessions, last
updated 2026-02-13) — it's useful for historical/design-decision context but
contains at least one claim that has been wrong since the very first session
(see §2). Don't treat it as authoritative; this file and direct verification
take precedence.

## 1. Site type and stack

Confirmed accurate: static HTML/CSS/JS, no framework, no build step, no
bundler, no package manager for the site itself. Every page is a standalone
`.html` file at the repo root with inline `<style>` blocks plus the shared
`style.css`/`gallery.css`. JS is plain ES5/ES6 in IIFEs (`menu.js`,
`gallery.js`, `easter-egg.js`, `counter.js`), no modules, no transpilation.

A `package.json` exists with one dependency (`docx`) — this belongs to the
in-progress Vietnamese language-test feature's `.docx`-generation script
(`duong_thuy/build-docs.js`), not the site. It does not affect how the site
itself is built or deployed.

## 2. Hosting and deploy

**This is GitHub Pages, not Cloudflare Pages.** Verified via DNS: `dig
walther.website` resolves to `185.199.108.153` / `.109.153` / `.110.153` /
`.111.153` — GitHub Pages' exact, documented IP range. The repo root has a
`CNAME` file (`walther.website`), which is specifically a GitHub Pages custom-
domain mechanism; Cloudflare Pages does not use a `CNAME` file for this.
`deploy.sh` does a plain `git add . && git commit && git push origin main`.

**This corrects every existing doc in this repo** — the old
`WALTHER-WEBSITE-COMPLETE-DOCUMENTATION.md` (written 2026-02-11) and the
untracked `README.md` both say "Cloudflare Pages." That claim appears to have
been wrong from the first documented session and just got copied forward
without anyone checking DNS.

**Deploy trigger:** push to `main` → GitHub Pages auto-builds and serves,
typically live within a minute or two. No staging environment, no preview
deploys, no CI checks of any kind — a push to `main` goes straight to the
live domain.

**Image storage (separate from hosting):** Cloudflare R2, accessed by the
client directly via public `.r2.dev` URLs (not proxied through the GitHub
Pages-hosted HTML/JS at all). Three buckets in use, confirmed against
project memory (bucket *names* aren't visible from the code itself — only
the public hostnames are, since the code just hits the public R2.dev URL
directly):
- **`100-paintings`** → `https://pub-c7202c315ad94697823c64022db4c1fd.r2.dev/`
  — this is `gallery.js`'s hardcoded default (`window.GALLERY_R2` fallback),
  used by `paintings.html`.
- **`site-general`** → `https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/drawings/`
  — `drawings.html` explicitly overrides `window.GALLERY_R2` to this before
  `gallery.js` runs. **This is a real, deliberate distinction, not a bug** —
  see §5.
- **`tmac-comics`** → `https://pub-fcf0788a82b94428b78b73e98356e858.r2.dev/`
  — used by `tmac/lightbox.js` for comic strip images (separate from the
  gallery system entirely).

There's also a small, independent **Cloudflare Worker** (`counter-worker/` in
this repo, its own `wrangler.toml`) deployed separately from the main site,
serving `https://walther-counter.newell-pdx.workers.dev/count` — this backs
the homepage's odometer-style visitor counter (`counter.js`). It has its own
deploy process (see `counter-worker/DEPLOY.md`), unrelated to the GitHub
Pages push-to-deploy flow for the main site.

## 3. Full page inventory

| File | What it is | In nav? | Notes |
|---|---|---|---|
| `index.html` | Homepage — rotating globe, easter egg | Yes | |
| `paintings.html` | Paintings gallery | Yes | Uses `100-paintings` R2 bucket |
| `drawings.html` | Drawings gallery | Yes | Uses `site-general` R2 bucket — different from paintings, see §5 |
| `text.html` | Text/writing-based works | Yes | |
| `exhibitions.html` | Exhibitions / CV listing | Yes | |
| `video.html` | Video works | Yes | |
| `about.html` | Bio page | Yes | |
| `contact.html` | Contact form + newsletter signup | Yes | mailto-based contact form; newsletter posts to a Google Apps Script endpoint |
| `writing.html` | Writing page | Yes | |
| `alaska.html` | Personal/bio narrative page | Yes | Linked from `about.html` |
| `vietnam.html` | Personal/bio narrative page | Yes | Linked from `about.html` |
| `childhood.html` | Personal/bio narrative page | Yes | Linked from `about.html`; added to sitemap.xml in last night's audit |
| `hitchhiking.html` | Personal/bio narrative page | Yes | Linked from `about.html`; added to sitemap.xml in last night's audit |
| `willow.html` | Personal/bio narrative page | Yes | Linked from `about.html`; added to sitemap.xml in last night's audit |
| `store.html` | Store page | Yes | |
| `tmac.html` | Manhattan Art Comic **placeholder** ("Test page... Coming soon") | Yes | Deliberately excluded from `robots.txt`/sitemap — see §8 |
| `lpt.html` | Vietnamese-language practice test (formerly `duong-thuy.html`, renamed) | Yes | Part of in-progress feature, see §9 |
| `tieng-viet.html` | Vietnamese-language content page | Yes | |
| `menu.html` | **Not a real page** — the reference copy of the nav menu markup, see §4 | Yes | Not linked from anywhere; exists purely as the "what the menu should look like" reference |
| `404.html` | Custom error page | **No** | Has its own "Return Home" link instead of the dropdown; deliberately minimal |
| `links.html` | Link-in-bio style page | **No** | Explicitly documented (`README.md`) as "Linktree replacement (not in menu)" — deliberate |
| `game.html` | Standalone fullscreen canvas minigame | **No** | No nav by design — it's a focused, fullscreen experience |
| `valentine.html` | Personal, one-off page (addressed to a specific person) | **No** | Not meant to be part of standard site navigation |

**Untracked / not in git, handle with care:**
- **`a-lát-xca.html`** — untracked locally, but returns **200 live**. It was
  deployed at some point before becoming untracked (likely an accidental
  `git rm --cached` or a `.gitignore` change) — the live version and this
  local file can now silently drift apart, since edits to the local file
  won't deploy until it's re-added to git. Not currently linked from
  anywhere on the live site (orphaned).
- **`duong-thuy.html`** — untracked locally, returns **404 live**. Genuinely
  dead; was renamed to `lpt.html` in an earlier commit and the old filename
  was never re-tracked. Safe to ignore/leave as-is.
- **`duong_thuy/`** (the directory, distinct from the `.html` file above) —
  untracked source material (scanned PDF, `.docx` files, a build script) for
  the in-progress language-test feature. Do not touch, see §9 and `CLAUDE.md`.

**Other repo contents, not pages:** `tmac/` (the real comic gallery — see
§8), `TMAC SITE /` (gitignored dev workspace mirroring `tmac/`), `unlisted/`
(empty), `counter-worker/` (separate Worker, see §2), `images/` (local
assets), `qr/` referenced in the old doc but not confirmed present in the
current listing.

## 4. The nav menu system

**There is no shared include, template, partial, or build step that
generates the menu.** Every nav-bearing page listed in §3 contains its own
literal, hand-copied `<div class="menu">...<ul class="dropdown">...</ul>
</div>` block. `menu.html` exists as a reference copy of what this markup
*should* look like, but nothing automatically syncs it to the other pages —
it's just a file a human (or a future session) can diff against.

An `update-menus.sh` script exists in the repo but is non-functional — it
defines the target markup as a string and loops over a hardcoded file list,
but the loop body is just a comment (`# This is a simplified approach...`)
with no actual file-editing logic. It does not do anything if run.

**Practical consequence, confirmed by last night's audit:** three files
(`writing.html`, `lpt.html`, and the reference `menu.html` itself) had
drifted — missing a real nav link (`text.html`) that the other pages had.
This was found by literally diffing the extracted `<ul class="dropdown">`
link list across every page, not by any tooling catching it automatically.

**The canonical, current menu (9 items), confirmed identical across all 20
non-excluded, non-drifted pages as of last night's fix:**
```html
<li><a href="index.html">Home</a></li>
<li><a href="paintings.html">Paintings</a></li>
<li><a href="drawings.html">Drawings</a></li>
<li><a href="text.html">Text-Based Work</a></li>
<li><a href="exhibitions.html">Exhibitions / CV</a></li>
<li><a href="video.html">Video</a></li>
<li><a href="https://19933.biz/manhattanartcomic.html" target="_blank">🔗 Manhattan Art Comic</a></li>
<li><a href="about.html">About</a></li>
<li><a href="contact.html">Contact</a></li>
```

**Any change to the nav (adding, removing, renaming, or reordering an item)
must be made identically in every one of these files, by hand, one at a
time. There is no single source of truth.** The checklist of files to edit:

```
index.html       about.html        air.html          alaska.html
childhood.html    contact.html      drawings.html     exhibitions.html
hitchhiking.html  lpt.html          menu.html         paintings.html
store.html        text.html         tieng-viet.html   tmac.html
video.html        vietnam.html      willow.html       writing.html
```
(Plus `duong-thuy.html` and `a-lát-xca.html` if those untracked files are
ever re-synced with git — see §3 for their special status. `404.html`,
`links.html`, `game.html`, and `valentine.html` are deliberately excluded —
do not add the nav to them.)

The `https://19933.biz/manhattanartcomic.html` link is external (a separate,
real, intentional cross-domain property — "Manhattan Art Review" — confirmed
by `/tmac/`'s own "← Back to Manhattan Art Review" link pointing to
`19933.biz/manhattanartreview.html`). **Never remove or modify this link when
editing the nav** — it points outside this site on purpose.

## 5. The gallery system (`gallery.js`)

One shared script (523 lines, IIFE, `window.initGallery` exposed globally)
powers both `paintings.html` and `drawings.html`. Each page calls
`initGallery(seriesData)` after fetching its own JSON data file
(`paintings-data.json` / `drawings-data.json` — `{ filename, title, year,
medium, dimensions }` per image, grouped into `series`).

**`paintings.html` and `drawings.html` pull from two genuinely different R2
buckets — this is a real, deliberate distinction, not a bug.**
`gallery.js`'s own default (`window.GALLERY_R2`) points at the
`100-paintings` bucket; `drawings.html` explicitly overrides this global
*before* `gallery.js` runs (`window.GALLERY_R2 =
'https://pub-1a24c863e9654cf59be6136420ba1770.r2.dev/drawings/'`). A past
session treated a check against the wrong bucket as "59 broken images" —
it wasn't a bug, the check was just comparing drawings' filenames against
the paintings bucket. **Always confirm which page you're checking before
testing image URLs.**

**Zoom/pan/swipe, in plain terms:**
- **Click to zoom (desktop):** click the lightbox image once to zoom in to
  whatever percentage the zoom slider is currently set to (slider range
  25–200%, defaults to 150% after any reset); click again to reset to 100%.
  The zoom is anchored to the exact point you clicked.
- **Click to zoom (mobile):** same idea, but fixed at a constant 150%
  (`MOBILE_ZOOM`) rather than a user-adjustable slider.
- **Mouse drag:** once zoomed in (desktop), click-and-drag pans the image.
- **Touch drag:** once zoomed in (mobile), single-finger drag pans the image.
- **Pinch-to-zoom:** two-finger touch gesture scales the image live between
  1x and 4x, anchored to the pinch midpoint.
- **Swipe to navigate:** when *not* zoomed (`scale === 1`), a horizontal
  swipe (more horizontal than vertical, >40px) moves to the next/previous
  image. This is deliberately disabled while zoomed in, so panning a zoomed
  image doesn't accidentally trigger navigation.
- **Keyboard:** arrow keys navigate images/series, Escape closes — disabled
  while zoomed in, same reasoning as swipe.
- Adjacent images are preloaded (2 ahead, 2 behind) for snappier navigation.

A minor, purely cosmetic inconsistency (not worth fixing): the lightbox
template's zoom slider has a hardcoded initial `value="50"`, but
`resetZoom()` (called on every image load, including the first) immediately
sets it to `150`. The `50` is effectively dead — never actually visible to
a user — not a functional bug.

## 6. Other key JS

- **`menu.js`** — two independent IIFEs in one file. (1) Intercepts every
  `wa.me` (WhatsApp) link click sitewide and shows a "WHATSAPP TEMPORARILY
  UNAVAILABLE" notice instead of letting the link navigate — **this is
  deliberate**, see §9. (2) The accessible dropdown menu itself: click to
  toggle, ARIA `aria-expanded`/`aria-haspopup`, closes on outside click, on
  Escape, and after selecting a link.
- **`easter-egg.js`** (649 lines) — the homepage title-letter physics
  animation: on click, letters detach and fall/bounce with simple physics
  (separate desktop/mobile animation paths), can form a random anagram of
  the title, plays small synthesized sound effects via the Web Audio API.
  Purely decorative; reviewed for bugs, found none.
- **`counter.js`** — fetches a visit count from the separate Worker
  (`walther-counter.newell-pdx.workers.dev`) and renders it as an
  odometer-style digit display on the homepage.
- **`script.js`** — legacy hover-based menu behavior, superseded by
  `menu.js`'s click-toggle approach (per the site's own `CLAUDE.md`-adjacent
  notes). Still present in the repo; not confirmed whether any page still
  loads it.

## 7. sitemap.xml and robots.txt

**`robots.txt`** (`Allow: /` for everyone, then specific `Disallow`s):
- `Disallow: /links.html` — "Keep links page private (only accessible via
  direct link)" per the file's own comment.
- `Disallow: /tmac.html` and `Disallow: /tmac/` — "Manhattan Art Comic test
  pages — not for indexing" per the file's own comment.

**`sitemap.xml`** currently lists 15 URLs: `/`, `paintings.html`,
`drawings.html`, `exhibitions.html`, `about.html`, `video.html`,
`text.html`, `writing.html`, `alaska.html`, `vietnam.html`,
`childhood.html`, `hitchhiking.html`, `willow.html`, `store.html`,
`contact.html`. (The last three of those were added in last night's audit —
real, linked pages that had simply never been added.)

**Deliberately absent from the sitemap** (confirmed, not oversights):
`links.html`, `tmac.html`, `/tmac/` — match the `robots.txt` exclusions
above. `404.html`, `menu.html`, `game.html`, `valentine.html` — none of
these are real indexable content. `duong-thuy.html`, `lpt.html`,
`tieng-viet.html` — part of the in-progress language-test feature, not yet
promoted to public indexing (a judgment call from last night, not
re-litigated here). `a-lát-xca.html` — currently orphaned/untracked, see §3.

## 8. The TMAC situation

Two genuinely separate things share the "tmac" name:
- **`/tmac.html`** — a placeholder page. Its actual body content is
  literally: `<h1>Manhattan Art Comic</h1><p>Test page for new home for
  Manhattan Art Comic strips.</p><p>Coming soon...</p>`. It *is* in the nav
  menu (the standalone, non-Manhattan-Art-Comic-link sense doesn't apply —
  this is a separate page from the external link), but excluded from
  `robots.txt`/sitemap.
- **`/tmac/`** (the directory, served as `tmac/index.html`) — the **real**
  comic gallery: 24 comics loaded from `tmac/comic-data.json`, rendered via
  `tmac/lightbox.js`, images served from the `tmac-comics` R2 bucket
  (`thumbs/` and `full/` subpaths). Also excluded from `robots.txt`/sitemap.
  Has its own "← Back to Manhattan Art Review" link to
  `https://19933.biz/manhattanartreview.html`.

As of the project owner's explicit sitemap-removal request: confirmed
`sitemap.xml` already contained **no** TMAC-related entries at all (neither
the placeholder, the gallery index, nor any individual comic-slug URLs — the
24 comics have never been individual sitemap entries, only JSON data
consumed client-side). No edit was needed; nothing to do here going forward
unless someone later adds a TMAC entry that needs removing again.

**`19933.biz` is a separate, real, intentional cross-domain property**
("Manhattan Art Review") that this site links to and is linked back from.
**Never remove or modify any `19933.biz` link anywhere it appears, in any
file, for any reason** — it's external by design, not a stale or broken
reference.

## 9. Known intentional non-standard things (do not "fix" these)

- **The WhatsApp link is deliberately JS-intercepted.** Every `a[href*="wa.me"]`
  on every page gets a click handler (`menu.js`) that prevents navigation and
  shows a "WHATSAPP TEMPORARILY UNAVAILABLE" notice for 3 seconds instead.
  The underlying `https://wa.me/84339441925` URL itself resolves fine (200,
  redirects to `api.whatsapp.com`) if checked directly — only the *in-page
  click* is blocked. This is intentional, not a broken link, even though a
  raw HTTP check of the URL will report it as healthy.
- **`game.html` and `valentine.html` have no nav by design** (§3) — a
  fullscreen minigame and a personal one-off page addressed to a specific
  person.
- **`404.html` and `links.html` also have no nav by design** (§3) — a
  minimal custom error page with its own "Return Home" link, and an
  explicitly-documented "Linktree replacement (not in menu)" page.
- **`drawings.html` uses a different R2 bucket than every other gallery
  page** (§5) — confirmed deliberate, not a migration artifact or bug.
- **`paintings.html`/`drawings.html` disable right-click and drag on
  images** (`gallery.js`) — deliberate, to discourage casual downloading of
  artwork.
- **The Vietnamese language-test feature (`lpt.html`, `tieng-viet.html`,
  the `duong_thuy/` directory, `package.json`'s `docx` dependency) is
  genuinely in-progress work**, not a half-finished accident — confirmed via
  its own substantial recent commit history. Don't "clean it up" or treat
  its untracked supporting files as orphaned cruft.

## 10. Open issues / decisions log

| # | Found | Status | Description |
|---|---|---|---|
| 1 | 2026-06-24 audit | **Open** | `permanentlyclosed.gallery` (an external CV citation on `exhibitions.html`, "opening show") returns a genuine 404 even with a full browser user-agent. Historical citation, not a live call-to-action — left for the project owner to decide whether to update or leave as-is. |
| 2 | 2026-06-25 (this session) | **Open** | `a-lát-xca.html` is live (200) but untracked in git — was deployed once, then dropped from tracking. Local edits to this file will silently NOT deploy until it's re-added with `git add`. Recommend either re-tracking it (if it should stay live) or confirming it should be taken down (if not). |
| 3 | 2026-06-25 (this session) | **Open** | `README.md` and the older `WALTHER-WEBSITE-COMPLETE-DOCUMENTATION.md` both incorrectly state the site is hosted on Cloudflare Pages. This file (`ARCHITECTURE.md`) is the corrected reference; the older docs were not edited (out of scope for this task) but should probably be corrected or retired at some point. |
| 4 | 2026-06-25 (this session) | **Not an issue, noted for awareness** | `update-menus.sh` exists but its loop body is empty (just a comment) — running it does nothing. If a future session is tempted to "use the existing script" to sync the nav, it won't work; the only reliable method right now is editing each file in §4's checklist by hand. |
