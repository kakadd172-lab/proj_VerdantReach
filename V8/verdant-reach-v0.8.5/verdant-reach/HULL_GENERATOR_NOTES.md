# Hull generator implementation notes

## Why these references were studied

The existing Verdant Reach generator already produced a full vessel from dimensions and vessel-specific profiles. The external projects were studied to improve the mathematical definition of a hull rather than replace the game's component builder.

- [C_ShipGen](https://github.com/noahbagz/C_ShipGen) — MIT-licensed research code. Its published parameterisation separates the overall hull, parallel midbody section, bow, stern/transom and optional bulb features. Its use of constrained design parameters informed the decomposition of the new module.
- [ship-hull-generator](https://github.com/janibert1/ship-hull-generator) — GPL-3.0 repository, inspected as a technical reference only. Its spline and cross-section tools illustrate the value of fair curves and section-based inspection.
- [ShipGen](https://github.com/noahbagz/ShipGen) — a related guided generative-design research project. It is not used as a runtime dependency or source-code base.

No source files, code blocks or translated implementations were copied from those repositories. The hull mathematics below is an independent JavaScript implementation tailored to Three.js and the existing Verdant Reach component API.

## What changed

The new `src/world/ship-hull-parameterization.js` provides five connected geometry controls:

1. **Longitudinal plan:** a piecewise cubic Bézier half-beam curve for the forebody and aftbody. The maximum-beam shoulder has a zero first derivative at the join, avoiding an abrupt tangent change.
2. **Midship cross-section:** controlled keel breadth, chine height, bilge fullness, upper flare and tumblehome.
3. **Bow and stern rocker:** separate smooth rise profiles toward the two ends.
4. **Deck sheer:** the existing vessel-specific sheer function supplies the upper hull boundary.
5. **Bounded dimensions:** the moulded maximum half-beam is never exceeded by the normalized cross-section. End faces are triangulated explicitly, including vessels with a nonzero stern/transom width.

The renderer still creates the 96-station, 40-section-point Three.js mesh and continues to expose the same independently addressable hull, deck, frame, strake, stern, rigging and component groups.

## What was deliberately not imported

- No Python, NumPy, SciPy, STL or machine-learning runtime was added to the browser project.
- No source from the GPL-3.0 Janibert project was copied.
- No source from the MIT C_ShipGen project was copied; only its published engineering decomposition informed an independent design.
- No unlicensed ShipGen files were incorporated.
- No generated training assets or external hull meshes were imported.

## Validation

Automated tests check Bezier endpoints, maximum-beam bounds, monotonic forebody/aftbody taper, positive section breadth, keel rocker, port/starboard symmetry, finite geometry points, explicit bow/stern cap triangles, and continued compatibility with the vessel component API.

These checks validate mathematical consistency and mesh construction. They do not establish that any particular hull is a historically exact reconstruction or a hydrodynamically optimised vessel. Visual review and comparison against measured lines plans remain separate steps.
