# chiranthaekanayake.github.io

Personal portfolio of Chirantha Ekanayake, Data Analyst. Live at https://chiranthaekanayake.github.io/

A static site with no build step: edit the files and upload them, and GitHub Pages publishes the change.

## What's where

| Path | What it is |
|---|---|
| `index.html` | All page content (text, projects, timeline, certifications). Edit text here. |
| `css/style.css` | Navy and purple design system. Colours, fonts and the type scale are variables at the top. |
| `js/main.js` | Interactions: hero entrance, smooth scroll, 3D tilt, reveals, filters, form. |
| `js/terrain.js` | The animated 3D "data terrain" in the hero (canvas, no libraries). |
| `js/vendor/` | GSAP, ScrollTrigger and Lenis, bundled so the site has no CDN dependency. |
| `fonts/` | Space Grotesk (headings), Inter (text, plus Inter Italic for the hero name) and JetBrains Mono (labels), self-hosted. |
| `assets/projects/` | Project images. Desktop and tablet (landscape 16:9): `name.webp` for the card, `name-full.webp` enlarged. Phones up to 767px wide (4:3): `name-m.webp` for the card, `name-m-full.webp` enlarged. |
| `assets/logos/` | Technology logos (Power BI, Excel, Tableau, Python, R, SQL, Minitab, MATLAB, PowerPoint), plus the MAS and University of Ruhuna logos. |
| `assets/portrait-cutout.webp` | Portrait with the background removed, used in the 3D hero. |
| `assets/profile.jpg` | Square photo, used for search engines and link previews. |
| `assets/og-image.png` | 1200×630 image shown when the link is shared on LinkedIn and elsewhere. |
| `assets/Chirantha_Ekanayake_CV.pdf` | The CV behind every "Download CV" button. Keep this exact file name. |

## Common edits

- **Replace a project image:** save the new image over the matching files in `assets/projects/` (keep the same names), or ask for it to be resized: landscape 960×540 (card) and 1600×900 (enlarged); phone 1024×768 (card) and 1448×1086 (enlarged).
- **After replacing a file with the same name:** in `index.html`, raise the `?v=` number on its links (for example `?v=3.9` to `?v=4.0`) so phones and browsers load the new file straight away instead of a saved copy.
- **Update the CV:** upload a new PDF named exactly `Chirantha_Ekanayake_CV.pdf` into `assets/`.
- **Add a certification:** in `index.html`, copy one `<li class="cert ...">` block under "Certifications".
- **Add a credential link:** see the comment above the certification list in `index.html`.
- **Add a project:** copy a whole `<li class="project" ...>` block. `data-category` must be `dashboards`, `analysis` or `research`, and update the counts on the filter buttons.
- **Change colours:** edit the palette at the top of `css/style.css` (`--navy`, `--midnight`, `--purple`, `--violet`, `--indigo`, `--cyan`).

## Contact form

GitHub Pages can't send email itself. By default the form says "Continue in your email app" and opens the visitor's email app with the message filled in. To receive messages directly instead:

1. Create a free form at https://formspree.io.
2. Paste its endpoint into `data-endpoint=""` on the `<form>` tag in `index.html`, for example `data-endpoint="https://formspree.io/f/abcdwxyz"`. The button switches to "Send message" automatically.

## Credits

Icons: Lucide (ISC), Devicon (MIT), SVG Logos (CC0) and VS Code Icons (MIT); brand logos belong to their owners. Fonts: Space Grotesk, Inter and JetBrains Mono (SIL Open Font License). Animation: GSAP (standard no-charge licence) and Lenis (MIT).
