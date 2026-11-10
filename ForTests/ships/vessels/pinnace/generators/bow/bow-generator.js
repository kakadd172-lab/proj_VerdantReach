import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function buildBow(d,ctx){const {part,box,materials}=ctx,bow=part('bowworks'),bowsprit=part('bowsprit');const thwart=part('bow-thwart',bow),seat=box(thwart,d.beamUnits*.52,.1,.34,materials.plank,'forward-thwart');seat.position.set(0,deckY(d,.12)-.16,-d.hullLengthUnits*.34);}
