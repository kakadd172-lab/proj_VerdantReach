/**
 * Build rope paths as straight spans. Catmull-Rom curves suit hull fairing
 * but make taut stays and sheets look slack and wavy when used for rigging.
 */
export function straightRiggingPath(ctx,parent,points,radius,material,name,segments=28){
 const valid=points.filter(point=>point?.isVector3);
 if(valid.length<2)return null;
 let first=null;
 const spanSegments=Math.max(6,Math.ceil(segments/(valid.length-1)));
 for(let i=0;i<valid.length-1;i++){
  const line=ctx.tube(parent,[valid[i],valid[i+1]],radius,material,
   valid.length===2?name:`${name}-span-${i+1}`,spanSegments);
  if(!first)first=line;
 }
 if(first)first.userData.riggingPath={kind:'straight-spans',spanCount:valid.length-1};
 return first;
}
