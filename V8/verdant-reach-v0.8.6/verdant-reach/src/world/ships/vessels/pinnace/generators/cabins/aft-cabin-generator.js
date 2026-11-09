import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function ensureSternTierComponents(d,ctx){
 const {part,box,materials}=ctx;
 const tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const name='stern-tier-'+(index+1);
  if(ctx.registry.has(name))return;
  const component=part(name);
  const width=d.beamUnits*tier.w*0.28;
  const height=Math.max(.18,tier.h*0.28);
  const depth=Math.max(.16,d.hullLengthUnits*tier.d);
  const shell=box(component,width,height,depth,materials.hull,'pinnace-independent-stern-tier');
  shell.position.set(0,deckY(d,.94)+height*(.44+index*.08),d.hullLengthUnits*(.405+index*.014));
  const cap=box(component,width*1.04,.09,depth*1.04,materials.trim,'stern-tier-cap');
  cap.position.set(0,shell.position.y+height*.52,shell.position.z);
 });
}
