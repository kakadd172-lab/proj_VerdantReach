import { deckY, halfBreadth, hullSurfacePoint, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * The central live-fish well shown in the 1866 deck and side plans.
 * The deck mesh leaves its footprint open; this component supplies the well,
 * cover grating, coamings and the paired hull-side water slots.
 */
export function buildVivier(d,ctx){
  const {part,box,beam,materials,V}=ctx;
  const spec=d.vivier||{length:4.4,width:1.1,startStation:0.40,endStation:0.69,ventCount:18};
  const well=part('vivier');
  const zFore=stationZ(d,spec.startStation,1),zAft=stationZ(d,spec.endStation,1);
  const length=Math.abs(zAft-zFore),width=spec.width*(4/3);
  const centerT=(spec.startStation+spec.endStation)*0.5;
  const centerZ=(zFore+zAft)*0.5;
  const deck=deckY(d,centerT);
  const depth=0.44*(4/3);
  const wellBody=part('vivier-body',well);
  const interior=box(wellBody,width*0.94,depth,length*0.96,materials.lower,'vivier-inner-well');
  interior.position.set(0,deck-depth*0.48,centerZ);

  const coaming=part('vivier-coaming',well);
  const rimY=deck+0.015;
  for(const side of [-1,1]){
    beam(coaming,V(side*width*0.5,rimY,zFore),V(side*width*0.5,rimY,zAft),0.035,materials.trim,'vivier-longitudinal-coaming');
  }
  for(const z of [zFore,zAft]){
    beam(coaming,V(-width*0.5,rimY,z),V(width*0.5,rimY,z),0.035,materials.trim,'vivier-end-coaming');
  }

  const grate=part('vivier-grate',well);
  const bars=14;
  for(let i=1;i<bars;i++){
    const t=i/bars,z=zFore+(zAft-zFore)*t;
    beam(grate,V(-width*0.46,deck+0.025,z),V(width*0.46,deck+0.025,z),0.016,materials.trim,'vivier-grating-bar');
  }
  for(const side of [-1,1]){
    beam(grate,V(side*width*0.31,deck+0.025,zFore),V(side*width*0.31,deck+0.025,zAft),0.012,materials.trim,'vivier-longitudinal-grate');
  }

  const vents=part('vivier-hull-vents',well);
  const count=spec.ventCount??18;
  for(const side of [-1,1]){
    for(let i=0;i<count;i++){
      const t=spec.startStation+0.035+(spec.endStation-spec.startStation-0.07)*i/Math.max(1,count-1);
      const low=hullSurfacePoint(d,t,side,0.48);
      const high=hullSurfacePoint(d,t,side,0.60);
      beam(vents,low,high,0.012,materials.lower,'vivier-side-water-slot');
    }
  }
}
