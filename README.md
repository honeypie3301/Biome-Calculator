# Biome Rarity Calculator

The Biome Rarity Calculator is a multi-dimensional visualization and simulation tool designed to model, test, and analyze procedural multi-noise biome generation environments for Minecraft and the Backwoods mod.

## Features

* **Multi-Noise 6D Climate Modeling**: Models Temperature, Humidity, Continentalness, Erosion, Weirdness, and Depth parameters to map biome distributions.
* **Interactive Map Projections**: Renders 2D slice projections of climate parameters, block-based coordinate grids, and Chunkbase-style world map simulations.
* **Minecraft Seed Hashing emulation**: Supports inputting numeric seeds or custom text seed strings using exact Java/Minecraft 32-bit and 64-bit hashing standards.
* **Custom Sandbox Mode**: Allows users to add, customize, persist, and delete custom biomes with fully adjustable climate target ranges.
* **MCreator Export**: Provides copy-ready formatted parameter values for direct import into MCreator biome configurations.

## Development & Deployment Notes

* **Workflow Persistence**: Never delete `.github/workflows/deploy.yml`. It is required for continuous deployment to GitHub Pages.
* **UI Design Integrity**: All dropdowns, buttons, inputs, and interactive components must adhere to the app's dark Minecraft ember theme.
