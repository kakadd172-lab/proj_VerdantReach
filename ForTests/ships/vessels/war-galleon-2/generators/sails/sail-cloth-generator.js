import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";

/**
 * War Galleon II's fuller, more heavily bellied canvas profile.
 * The lower panel carries more cloth fullness while the upper panels taper
 * more tightly towards their leeches; all four support edges remain fixed.
 */
export function buildCanvasSail(ctx,name,mastId,corners,fullness=.09,parent=ctx.root,axis='z'){
 const {part,mesh,materials,THREE}=ctx;
 const control=part(name,parent);
 control.userData.sailControl={mastId,clothPart:'cloth-'+name};
 const cloth=part('cloth-'+name,control);
 const points=corners.map(point=>point?.isVector3?point.clone():V(...point));
 const span=(points[0].distanceTo(points[3])+points[1].distanceTo(points[2]))*.5;
 const height=(points[0].distanceTo(points[1])+points[3].distanceTo(points[2]))*.5;

 // A distinct late-sixteenth-century war-galleon cloth section: fuller
 // horizontal belly, restrained upper-panel fullness, and a slight leech bias.
 const sailProfile={
  camberScale:1.12,
  chordPower:1.08,
  verticalPower:0.84,
  leechBias:0.16,
  twistFactor:0.026,
  lowerPanelBias:0.065,
  shoulderBias:0.035
 };
 const reference=Math.max(.35,span,height*.52);
 const camber=reference*THREE.MathUtils.clamp(fullness,.035,.15)*sailProfile.camberScale;
 const rows=18,columns=24,positions=[],indices=[];

 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let col=0;col<=columns;col++){
   const u=col/columns;
   const lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u);
   const p=lower.lerp(upper,v);
   const chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),sailProfile.chordPower);
   const vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),sailProfile.verticalPower);
   const shoulder=1+sailProfile.shoulderBias*Math.sin(Math.PI*u)*(1-v);
   const lowerPanel=1+sailProfile.lowerPanelBias*(1-v)*(1-v);
   const belly=camber*chord*vertical*shoulder*lowerPanel
    *(1+sailProfile.leechBias*(1-2*u));
   const twist=reference*sailProfile.twistFactor
    *Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);
   if(axis==='x'){p.x+=belly;p.z+=twist;}
   else{p.z+=belly;p.x+=twist;}
   positions.push(p.x,p.y,p.z);
  }
 }

 const stride=columns+1;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=row*stride+col;
  indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 geometry.computeBoundingBox();
 geometry.computeBoundingSphere();
 mesh(cloth,geometry,materials.sail,'sail-shaped-cloth');

 const seams=part('panel-seams-'+name,control);
 const vertexAt=(u,v)=>{
  const gx=THREE.MathUtils.clamp(u,0,1)*columns;
  const gy=THREE.MathUtils.clamp(v,0,1)*rows;
  const x0=Math.floor(gx),x1=Math.min(columns,x0+1);
  const y0=Math.floor(gy),y1=Math.min(rows,y0+1);
  const fx=gx-x0,fy=gy-y0;
  const read=(x,y)=>new THREE.Vector3(
   positions[(y*stride+x)*3],
   positions[(y*stride+x)*3+1],
   positions[(y*stride+x)*3+2]
  );
  const p=read(x0,y0).lerp(read(x1,y0),fx)
   .lerp(read(x0,y1).lerp(read(x1,y1),fx),fy);
  if(axis==='x')p.x+=.004;
  else p.z+=.004;
  return p;
 };
 const seam=(label,fixed,alongU)=>{
  const line=[];
  for(let i=0;i<=24;i++){
   const t=i/24;
   line.push(vertexAt(alongU?t:fixed,alongU?fixed:t));
  }
  ctx.tube(seams,line,.006,materials.sailShade,'sail-stitch-'+label,28);
 };
 for(let i=1;i<=3;i++)seam('reef-'+i,i/4,true);
 for(let i=1;i<=2;i++)seam('panel-'+i,i/3,false);
 return control;
}
