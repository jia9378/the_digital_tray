# The Digital Tray

A stone layout tool for jewelers. It's a jeweler's stone tray in the browser: stones go into grooves and can be nudged, swapped and compared at true mm scale.

**First draft: tray only.** Study, Try On and Save A / B come later.

## Run it

No server or build step. Open `index.html` in a browser.

## What works

- **Stone library:** sapphire, ruby, emerald and diamond in round, oval, pear and emerald cuts. Filter by gem with the tabs.
- **Tray:** 200 × 100 mm with 6 grooves. Drag a stone from the library onto the tray (or click it to add). Stones snap to the nearest groove.
- **Edit a stone:** click it to select it, then:
  - drag to move it
  - **Rotate 15°** (or press `R`)
  - **Duplicate**
  - **Delete** (or press `Delete`)
  - set its width and height in mm
- Everything is stored in millimetres. The SVG `viewBox` is in mm too, so 1 unit = 1 mm.

## Files

```
index.html       page layout
css/style.css    styles
js/stones.js     gem colours, cut sizes, and how each cut is drawn
js/tray.js       tray state, drawing, drag and the edit panel
```
