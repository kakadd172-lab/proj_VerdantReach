import { deckY, hullSurfacePoint, stationZ, V } from "../../architecture/hull-geometry.js";

/**
 * Central live-fish well from the 1866 deck plan. The deck is genuinely open
 * over this component: only the bottom, side boards, end bulkheads, water
 * surface and grating are generated here.
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
  const depth=0.48*(4/3),wall=0.055;
  const interior=part('vivier-interior',well);
  const bottom=box(interior,width-wall*2,wall,length-wall*2,materials.lower,'vivier-bottom-board');
  bottom.position.set(0,deck-depth,centerZ);
  for(const side of [-1,1]){
    const board=box(interior,wall,depth,length-wall*2,materials.plank,'vivier-longitudinal-wall');
    board.position.set(side*(width*0.5-wall*0.5),deck-depth*0.5,centerZ);
  }
  for(const [name,z] of [['fore',zFore],['aft',zAft]]){
    const bulkhead=box(interior,width,depth,wall,materials.plank,'vivier-'+name+'-bulkhead');
    bulkhead.position.set(0,deck-depth*0.5,z+(name==='fore'?wall*0.5:-wall*0.5));
  }

  const water=part('vivier-water',well);
  const waterPlane=box(water,width-wall*2,0.018,length-wall*2,materials.glass,'vivier-water-surface');
  waterPlane.position.set(0,deck-depth*0.28,centerZ);

  const coaming=part('vivier-coaming',well),rimY=deck+0.015;
  for(const side of [-1,1]){
    beam(coaming,V(side*width*0.5,rimY,zFore),V(side*width*0.5,rimY,zAft),0.035,materials.trim,'vivier-longitudinal-coaming');
  }
  for(const z of [zFore,zAft]){
    beam(coaming,V(-width*0.5,rimY,z),V(width*0.5,rimY,z),0.035,materials.trim,'vivier-end-coaming');
  }

  const grate=part('vivier-grate',well),bars=14;
  for(let i=1;i<bars;i++){
    const t=i/bars,z=zFore+(zAft-zFore)*t;
    beam(grate,V(-width*0.46,deck+0.025,z),V(width*0.46,deck+0.025,z),0.014,materials.trim,'vivier-grating-bar');
  }
  for(const side of [-1,1]){
    beam(grate,V(side*width*0.31,deck+0.025,zFore),V(side*width*0.31,deck+0.025,zAft),0.012,materials.trim,'vivier-longitudinal-grate');
  }
  for(const side of [-1,1]){
    const vents=part('vivier-hull-vents-'+(side<0?'port':'starboard'),well);
    for(let i=0;i<(spec.ventCount??18);i++){
      const t=spec.startStation+0.035+(spec.endStation-spec.startStation-0.07)*i/Math.max(1,(spec.ventCount??18)-1);
      const lower=hullSurfacePoint(d,t,side,0.46);
      const upper=hullSurfacePoint(d,t,side,0.58);
      beam(vents,lower,upper,0.012,materials.lower,'vivier-side-water-slot');
    }
  }
}
