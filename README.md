# The Digital Tray

A stone layout tool for jewelers. It's a jeweler's grooved stone tray in the browser: stones go into grooves and can be nudged, swapped and compared at true mm scale, then tried out on a ring, bracelet or necklace.

## Run it

No build step. Open `index.html` in a browser, or serve the folder (for example with VS Code Live Server, or `python3 -m http.server`).

## What works

- **True scale.** On first visit the app asks which screen you're on (MacBooks first, then iMac, Apple displays and iPad, or any screen by its diagonal). It then sizes the tray so 1 mm on screen is 1 mm on the glass. A bank-card outline and a 50 mm ruler let you check it and fine-tune by eye. Click the scale button in the top bar to change it. Keep browser zoom at 100% (⌘0).
- **Tray.** A 200 × 100 mm white tray with 7 V-grooves running edge to edge and a flat strip at the bottom, with a mm ruler under it. Stones snap into the nearest groove; on the flat strip they stay where you drop them.
- **Stones.** 23 materials: diamond, sapphire, ruby, emerald, spinel, tanzanite, aquamarine, topaz, tourmaline, garnet, amethyst, citrine, peridot, morganite, opal, moonstone, turquoise, jade, lapis, onyx, pearls, crystal beads and faceted glass crystals. Each has its own colours (pick the stone first, then the colour).
- **Crystal beads (水晶).** Polished round beads, drilled through: clear quartz, amethyst, citrine, rose and smoky quartz, golden and black rutilated, green phantom, strawberry quartz, garnet, aquamarine, moonstone, sunstone, tiger's eye, rhodochrosite, larimar and obsidian, each with its own inclusions (rutile hairs, specks, stripes, phantom moss). The drill hole runs along the cord, so beads turn to follow it, while the highlight always stays top left.
- **Cuts with real facet layouts.** Round, oval, cushion, princess, pear, marquise and heart brilliants (table, stars, kites, upper girdle facets); emerald, Asscher and baguette step cuts; cabochons; round, drop and baroque pearls; round, faceted and bicone beads.
- **Edit a stone.** Click it, then change its stone, colour, cut and size (mm), see it enlarged with an estimated carat weight, rotate, duplicate or delete it.
- **Piece.** Ring (top view on a finger plus a front view, by US size and band width), bracelet (line laid flat, bead bracelet 手串 on an elastic cord, or bangle) and necklace (worn, by chain length). Stones snap onto the metal line. **Fill along line** copies a stone all the way along it; on a bead bracelet the beads touch and close the loop evenly (20 × 8 mm beads on a 16 cm cord). Pick a metal, or **Compare all metals** to see the same layout in yellow, rose and white gold, platinum, silver and black rhodium side by side.
- **Tray beside the piece.** The Piece tab shows your tray's stones in a small panel (zoomed to fit, not true size). Drag a stone onto the piece, or click it and press **Add to piece**, or **Add its groove** to bring a whole row across. A stone selected on the Tray tab is already picked.
- **Study.** Pick any stone (or open Study with a stone selected). It shows the stone enlarged with its size, a table of gem data (species, formula, crystal system, refractive index, double refraction, dispersion, critical angle, hardness, specific gravity, lustre) and a note, and a 2D cross-section with a ray traced through it with Snell's law. Move where the ray enters and its tilt; for faceted cuts, change the crown and pavilion angles and watch light return or leak. **Fire** splits the ray into red, green and violet (dispersion), **Double** into two rays (birefringence); small spreads are drawn 10× larger and the page says so. Opaque stones and pearls show surface reflection instead, pearls with their nacre layers. The data is hand-compiled typical values (see `js/gemdata.js`); check them before relying on them.
- **Try On.** Take a webcam photo (5 s timer for two hands) or upload one, with a bank card in it at the same distance as your hand, wrist, neck or ear. Click both ends of one card edge: the card is 85.60 × 53.98 mm, so that gives the photo's pixels per mm. Your ring, the visible part of your bracelet, your necklace, or a stud of the stone picked in the library is drawn on the photo at that scale. Drag it into place, rotate it, switch metal, and save the result as a PNG. The photo isn't saved anywhere.
- **Keys:** `R` rotate (`⇧R` back), `D` duplicate, `Delete` remove, arrows nudge 0.5 mm (`⇧` 0.1 mm), `Esc` deselect.
- Everything is saved in the browser (localStorage).

## How true scale works

Each board's SVG `viewBox` is in mm. The app needs CSS pixels per mm:

```
px per mm = screen long side in CSS px / screen long side in mm
```

`screen.width` already follows the macOS "Looks like" display setting. The physical size comes from the chosen device: native pixels ÷ Apple's published ppi. The card check multiplies that by a small fine-tune factor.

## Files

```
index.html         page layout
css/style.css      styles
js/gems.js         materials, colours, cuts, carat estimate
js/draw.js         draws each cut: outlines, facet layouts, shading, pearl and cabochon gradients
js/scale.js        screen list and the true-scale set-up dialog
js/templates.js    ring, bracelet and necklace templates, metals
js/gemdata.js      gem data for Study (typical values, per gem and per colour)
js/study.js        Study: data table, cross-sections, ray tracing
js/tryon.js        Try On: camera, card calibration, overlay, PNG export
js/app.js          tray and piece boards, drag and drop, inspector, library, saving
```
