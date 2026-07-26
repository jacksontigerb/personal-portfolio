# Pixel character generator

Produces the nine `assets/char-*.png` figures and `assets/face-*.png` roster
tiles for the character select on `index.html`.

The whole figure is traced from `grad.png` (the voxel render) onto a 44x97
grid, so every character keeps the reference's own shading. Each outfit in
`CHARS` recolours garments (gown, stole, shirt, tie, trousers, shoes, hands)
by mapping the reference's lightness range onto a target range, which is why
folds and voxel facets survive the recolour. Accessories (hats, goggles,
headphones) inherit the lightness of the hair or face cells they cover; props
(skis, pole, football) are synthesised in the 5 cell side margins, lit from
the left like the reference.

```
node gen2.js roles     # rolemap.png — check the garment classification
node gen2.js preview   # sheet.png — all nine, plus face crops
node gen2.js write     # writes the 18 PNGs into ../../assets
```

Most outfits are cut into hip length jackets by `derobe()` (the Master keeps
the full graduate robe, the Researcher a knee length lab coat); below the hem
the freed cells become separated legs.

The art is 62 cells wide (44 + 9 margin each side) by 97 tall. If that ratio
ever changes, update `var CW=…,CH=…` in index.html so the stage canvas
matches, or the figures will stretch.
