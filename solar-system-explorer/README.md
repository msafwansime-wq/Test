# Solar System Explorer

An interactive 3D web app for exploring the Sun, the eight planets, the dwarf planets Pluto, Ceres and Eris, the asteroid and Kuiper belts, and the solar system's most interesting moons. Built with React, Three.js (React Three Fiber), Tailwind CSS, Lucide icons and Recharts.

## Run it

```bash
cd solar-system-explorer
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/ (static; host anywhere)
npm run preview   # serve the production build
```

## Features

| Area | What you can do |
| --- | --- |
| **Solar System (overview)** | Every planet orbits the Sun at its **real position for the date shown**, calculated from NASA/JPL Keplerian elements: real orbit shapes, tilts and relative speeds. Click any body or label to fly the camera to it and follow it. Drag to rotate, scroll or pinch to zoom, right-drag to pan. Buttons zoom, reset the view, and toggle labels, orbits, moons and the belts. |
| **Time simulation** | Play/pause (Space), slower/faster (`[` / `]`) from 1 hour/s up to 5 years/s, and reset to today. A live date readout shows the simulated date. |
| **Scale modes** | Distances can be *compressed* (√ scale) or *true proportions*. Planet sizes can be *enlarged* or *true ratios*. The "Understanding scale" panel says exactly what is accurate and what is exaggerated, with computed factors, and includes a 1-metre-Sun scale model. |
| **Compare Sizes** | All eight planets side by side at **true relative size**, with the edge of the Sun to scale. Pick planets A and B (in 3D, in the dock or in the panel) to compare diameter, mass, gravity, temperature, distance, year and day. Comparisons use bar charts, an overlaid size diagram and plain-language explanations. |
| **Explore World** | A large 3D view of any planet, dwarf planet, moon or the Sun. It spins at its **real rotation rate** under a time-lapse you choose (1 s = 10 min … 1 day), shows its spin axis and tilt, and shows its major moons orbiting. Tap a moon to visit it. |
| **Info panel** | Overview (key stats, weight calculator, what's unique, habitability, spacecraft visits), Orbit, Physical (interior diagram, atmosphere, surface, magnetic field, geology), Facts (five each) and Missions (timeline). Technical terms have tooltips. |
| **Moon Explorer** | Earth's Moon, Phobos, Deimos, Io, Europa, Ganymede, Callisto, Titan, Enceladus, Triton and Charon. An "Ocean worlds" filter highlights moons with known or suspected subsurface oceans. |
| **Learn** | "Did You Know?" explainers (shortest day, longest year, why Venus is hotter than Mercury, why Saturn would float, why Jupiter is so massive, why Pluto is a dwarf planet…) and a 10-question quiz that explains every answer and keeps score. |
| **Discover & Search** | A random-fact button with "Take me there", and search (`/` or Ctrl/⌘+K) across planets, moons, dwarf planets and regions. |
| **Responsive & resilient** | A desktop layout with side panels, and a mobile layout with bottom sheets. The 3D view re-centres around open panels. If WebGL is unavailable or the GPU context is lost, an animated 2D SVG fallback takes over. |

## Scientific accuracy

* **Data:** NASA Planetary Fact Sheet and NASA Science pages (sizes, masses, gravity, temperatures, periods, speeds), JPL *Approximate Positions of the Planets* (orbital elements, valid 1800–2050), and the JPL Small-Body Database (Ceres and Eris). Positions for Ceres and Eris are approximate.
* **Moon counts** are those officially recognised as of 2025 (Jupiter 97, Saturn 274, Uranus 29, Neptune 16).
* **What is real vs. visual:** positions, orbit shapes, orbital speeds and rotation periods are real. Distances and sizes are scaled for usability, and the app always shows which scale is active. Overview spin rates are capped at high simulation speeds to avoid strobing. Moon distances around planets are compressed, and the app says so.
* Interior diagrams are simplified models.

## Project structure

```
src/
  data/        planets.js, moons.js, learn.js (facts, quiz, glossary)
  lib/         orbits.js (Kepler solver, scales), store.js, textures.js, catalog.js, labels.js
  components/
    scene/     Stage, OverviewScene, CompareScene, ExploreScene, Body (planets, rings,
               atmosphere, Sun), Starfield, Label3D, ViewOffset, Fallback2D
    panels/    InfoPanel, ComparePanel, ExploreHUD, MoonsDrawer, LearnDrawer, ScaleDrawer
    ui/        TopBar, PlanetDock, TimeControls, ViewControls, SearchDialog, DiscoveryToast,
               LabelLayer, Term (glossary tooltip)
public/textures  planet maps
```

## Texture credits

* Earth (day, normal, specular, clouds) and Moon maps: from the [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets) (MIT), derived from NASA imagery.
* Other planet, Sun, Pluto and Saturn-ring maps: from [threex.planets](https://github.com/jeromeetienne/threex.planets), based on James Hastings-Trew's Planet Pixel Emporium maps, which derive from NASA/JPL data.
* Ceres, Eris and most moons use procedurally generated textures (made in the browser at runtime). The same generator acts as an instant placeholder, and as a fallback if an image fails to load.
