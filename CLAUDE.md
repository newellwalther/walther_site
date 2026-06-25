# walther.website — Claude Code Reference

> Read `ARCHITECTURE.md` in full before making any structural change
> (nav, hosting/deploy assumptions, the gallery system, TMAC). It documents
> the site as verified directly against the code and the live site, and
> corrects several wrong claims in the older docs in this repo.

## Voice & style — this is NOT the MoT+++ project, don't import its rules

This is Andrew's personal artist site, not an institutional one. Checked
actual page copy before assuming anything carried over from the
motplusplusplus.com project:

- **Em dashes are used freely and naturally** — in body copy and even in
  page `<title>` tags themselves ("About — Andrew Newell Walther", "Alaska
  — Andrew Newell Walther", etc.). The MoT+++ "no em dashes" rule does
  **not** apply here. Don't go remove them.
- **Casing is conventional, not the MoT+++ all-lowercase convention** —
  page titles use Title Case, and headings are a genuine mix (some Title
  Case, some ALL CAPS, e.g. `EXHIBITIONS / CV`, `ABOUT A.N.WALTHER`). There
  is no single enforced casing rule to "fix" pages toward — match whatever
  the specific page already does, don't impose a sitewide standard that
  doesn't exist.
- US spelling is used where it comes up, consistent with the artist being
  US-born (Alaska) — no evidence of a deliberate US-vs-UK spelling policy
  either way; just don't introduce inconsistency.

If in doubt about a specific page's voice, read a couple of neighboring
paragraphs on that exact page before writing new copy — this site's tone
varies more page-to-page (personal narrative pages like `alaska.html`,
`childhood.html` read very differently from the more functional
`exhibitions.html` or `contact.html`) than MoT+++'s does.

## Standing rule: never edit the nav menu in only one file

There is no shared template/include for the menu — every nav-bearing page
has its own hand-copied copy of the `<div class="menu">` markup (see
`ARCHITECTURE.md` §4). **Any nav change (add/remove/rename/reorder a link)
must be applied identically across every file in that section's checklist,
one at a time.** `update-menus.sh` exists but does nothing (its loop body
is empty) — don't rely on it. After editing, re-extract and diff the
`<ul class="dropdown">` content across all nav-bearing pages to confirm
they're still identical — this is exactly how last night's drift (3 files
missing a link) was found, and exactly how to confirm a fix took everywhere.

## Never confuse the paintings.html and drawings.html R2 buckets

These two galleries use **different Cloudflare R2 buckets** — this is
deliberate (`ARCHITECTURE.md` §5), confirmed with Andrew, not a bug or
migration leftover. `gallery.js`'s own default points at the paintings
bucket (`100-paintings`); `drawings.html` explicitly overrides
`window.GALLERY_R2` to the `site-general` bucket before `gallery.js` loads.

**Before flagging any gallery image as broken, confirm which page/bucket
you're actually checking.** A past session checked all 91 painting+drawing
filenames against the paintings bucket and reported 59 "broken" images —
they were all drawings, checked against the wrong bucket. Real bug count:
zero.

## Deploy behavior

**Confirmed via DNS, not assumption:** this site is hosted on **GitHub
Pages** (A records match GitHub's documented IP range exactly), not
Cloudflare Pages — see `ARCHITECTURE.md` §2 for the full correction; the
older docs in this repo (including the untracked `README.md`) say
Cloudflare Pages and are wrong.

**Trigger: a push to `main` deploys immediately** (live within ~1-2
minutes), with no staging, no preview, no CI gate of any kind. Treat every
`git push origin main` here as equivalent to a production deploy on
MoT+++ — **give Andrew a heads-up before pushing**, matching his stated
preference on the MoT+++ project of being told when a deploy is about to
trigger automatically, rather than assuming a quiet commit is low-stakes.

## Do not touch without being explicitly asked

- **`game.html`, `valentine.html`** — intentionally have no nav menu (a
  fullscreen minigame, and a personal one-off page). Don't add nav to
  these, don't "fix" the missing menu.
- **`404.html`, `links.html`** — also intentionally nav-less (see
  `ARCHITECTURE.md` §3/§9). Same rule.
- **The WhatsApp link interception in `menu.js`** — deliberate, not a bug.
  Don't "fix" it so `wa.me` links navigate normally.
- **The site's easter eggs** — there are at least three (`ARCHITECTURE.md`
  §6): the elaborate homepage title-letter physics animation
  (`easter-egg.js`), and simpler 180°-letter-flip click handlers on
  `about.html`'s and `contact.html`'s own page titles (inline `<script>`
  tags, not in any shared JS file). Two of the three aren't even labeled
  as easter eggs in a comment — if you find an odd inline script at the
  bottom of a page that flips/rotates a heading on click, it's one of
  these. Leave it alone.
- **`drawings.html`'s different R2 bucket** — deliberate, see above. Don't
  "fix" it to match `paintings.html`.
- **The in-progress Vietnamese language-test feature** — `lpt.html`,
  `tieng-viet.html`, the entire `duong_thuy/` directory (scanned PDF,
  `.docx` files, a build script), and `package.json`'s `docx` dependency.
  This is real, active, in-progress work with its own substantial recent
  commit history — not orphaned cruft to clean up. Leave all of it alone
  unless explicitly asked to work on it.
- **Any other untracked file or directory** found in this repo (check
  `git status` first) — there is consistently a meaningful amount of
  in-progress local work here that hasn't been committed yet. Don't sweep
  it into an unrelated commit, don't delete it, don't assume it's safe to
  ignore just because it's untracked.
- **`a-lát-xca.html`** specifically — it's untracked but currently *live*
  (see `ARCHITECTURE.md` §3/§10 issue #2). Don't edit it assuming a push
  will deploy the change (it won't, since it's not tracked) and don't
  delete the local file assuming the live version will also disappear (it
  won't, until GitHub Pages' served content changes via some other deploy).
  Flag this discrepancy rather than acting on either assumption.

## Working pattern

Same as the MoT+++ project: **report findings before writing code.** If an
asset, a content choice, or which of two similar files is "the real one"
is ambiguous (e.g. `duong-thuy.html` vs `lpt.html`, or whether
`a-lát-xca.html` should be re-tracked or taken down), surface it and ask
rather than guessing. Verify against the live site and/or DNS directly
where it matters (see the hosting correction above as the canonical example
of why) rather than trusting an existing doc, including this one and
`ARCHITECTURE.md`, without spot-checking anything that looks stale.
