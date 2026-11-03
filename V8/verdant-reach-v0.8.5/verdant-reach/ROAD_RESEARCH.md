# Verdant Reach — Road and Route Research Notes (v0.8.2)

## Design principles

The road system is a stylised low-volume pre-industrial network, not a modern highway simulator. Routes should prefer stable, dry, gently graded ground; follow contours where a direct climb would be too steep; avoid cliff bands and ravine channels; and use a bridge only where a watercourse is actually crossed.

### Terrain alignment
- The route planner uses elevation change and local slope as cost inputs. A route that is longer but avoids a steep ridge or wet ravine is preferred over a short straight line.
- A route is not drawn when the terrain search cannot find a buildable path. This is preferable to silently drawing a road through a cliff or across open water.
- The rendered centre-line is resampled at about 4 m intervals and the full road width is sampled against the terrain height field.
- A shallow crown and slightly lower shoulder are used as a visual drainage cue. The 2.5% crown is a game-art target, not a claim that every historical road had a uniform engineered crossfall.

### Drainage and crossings
The FHWA HEC-22 road drainage manual describes cross slope as a key way to move water off a pavement surface and gives typical ranges for different pavement types. Its guidance is used here as a reference for the principle of a crowned surface, not as a literal specification for every dirt road in the game. Shoulders can also be sloped to assist drainage.

Generated rivers are sampled along the route. Where a road crosses a river channel, the road deck is lifted above the sampled water surface and rendered with timber boards and simple rails. Approaches remain terrain-draped.

### Sources
- Federal Highway Administration, *Urban Drainage Design Manual (HEC-22), 4th edition*, Chapter 5: https://www.fhwa.dot.gov/engineering/hydraulics/pubs/hif24006.pdf
- Federal Highway Administration, *Geotechnical Aspects of Pavements*, drainage and positive drainage grades: https://highways.fhwa.dot.gov/sites/fhwa.dot.gov/files/FHWA-NHI-05-037.pdf
- Federal Highway Administration, *An Integrated Approach to Sustainable Roadside Design and Restoration*, terrain impacts, slope stabilisation and drainage: https://www.fhwa.dot.gov/clas/ctip/roadside_design_and_restoration/ch_3_2.aspx

## Scope limits
This is a procedural visual/navigation system. It does not calculate real-world earthworks, culvert hydraulics, bridge load capacity, retaining walls or survey-grade vertical curves.