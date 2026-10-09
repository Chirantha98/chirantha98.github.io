# chirantha98.github.io

Personal portfolio of Chirantha Ekanayake, Data Analyst. Live at https://chirantha98.github.io/

A static site with no build step: edit the files and upload them, and GitHub Pages publishes the change.

## What's where

| Path | What it is |
|---|---|
| `index.html` | All page content (text, projects, timeline, certifications). Edit text here. |
| `css/style.css` | Navy and purple design system. Colours, fonts and the type scale are variables at the top. |
| `js/main.js` | Interactions: hero entrance, smooth scroll, 3D tilt, reveals, filters, form. |
| `js/terrain.js` | The animated 3D "data terrain" in the hero (canvas, no libraries). |
| `js/vendor/` | GSAP, ScrollTrigger and Lenis, bundled so the site has no CDN dependency. |
| `fonts/` | Space Grotesk (headings), Inter (text) and JetBrains Mono (labels), self-hosted. |
| `assets/logos/` | Technology logos (Power BI, Excel, Tableau, Python, R, SQL, Minitab, MATLAB, PowerPoint). |
| `assets/portrait-cutout.webp` | Portrait with the background removed, used in the 3D hero. |
| `assets/profile.jpg` | Square photo, used for search engines and link previews. |
| `assets/og-image.png` | 1200×630 image shown when the link is shared on LinkedIn and elsewhere. |
| `assets/Chirantha_Ekanayake_CV.pdf` | The CV behind every "Download CV" button. Keep this exact file name. |

## Common edits

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
