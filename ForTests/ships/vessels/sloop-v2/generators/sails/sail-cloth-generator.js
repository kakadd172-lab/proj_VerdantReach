import { V } from '../../architecture/hull-geometry.js';

export function buildCanvasSail(ctx,name,mastId,corners,fullness=.10,parent=ctx.root,axis='x'){
 const {THREE,part,mesh,tube,materials}=ctx;
 const sail=part(name,parent),deployment=new THREE.Group();
 deployment.name='sail-deployment-'+name;
 deployment.userData.sailDeploymentAssembly=true;
 sail.add(deployment);
 sail.userData.sailControl={mastId,clothPart:'cloth-'+name,deploymentPart:deployment.name,windPivot:true};
 const points=corners.map(p=>p?.isVector3?p.clone():V(...p));
 const triangular=points[0].distanceTo(points[3])<.001;
 const span=triangular?points[0].distanceTo(points[2]):
  (points[0].distanceTo(points[3])+points[1].distanceTo(points[2]))*.5;
 const height=triangular?points[0].distanceTo(points[1]):
  (points[0].distanceTo(points[1])+points[3].distanceTo(points[2]))*.5;
 const rows=22,columns=26,positions=[],indices=[];
 const camber=Math.max(.25,span,height*.52)*THREE.MathUtils.clamp(fullness,.04,.15);
 for(let row=0;row<=rows;row++){
  const v=row/rows;
  for(let col=0;col<=columns;col++){
   const u=col/columns,lower=points[0].clone().lerp(points[3],u);
   const upper=points[1].clone().lerp(points[2],u),p=lower.lerp(upper,v);
   const belly=camber*Math.pow(Math.sin(Math.PI*u),1.18)*Math.pow(Math.sin(Math.PI*v),.92);
   if(axis==='x')p.x+=belly;else p.z+=belly;
   positions.push(p.x,p.y,p.z);
  }
 }
 const stride=columns+1;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=row*stride+col;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 // Keep all three sails in natural canvas; seam stitching remains subtly darker.
 const cloth=part('cloth-'+name,deployment),canvas=mesh(cloth,geometry,materials.sail,'sail-shaped-cloth');
 canvas.userData.sailCloth={rows,columns,axis};
 const seams=part('panel-seams-'+name,deployment);
 const pointAt=(u,v)=>{
  const x=Math.round(THREE.MathUtils.clamp(u,0,1)*columns);
  const y=Math.round(THREE.MathUtils.clamp(v,0,1)*rows),i=(y*stride+x)*3;
  return V(positions[i],positions[i+1],positions[i+2]);
 };
 const edge=(label,fn)=>{
  const line=[];for(let i=0;i<=30;i++)line.push(fn(i/30));
  tube(seams,line,.008,materials.rope,'sloop-v2-sail-boltrope-'+label,32);
 };
 const seam=(label,fn)=>{
  const line=[];for(let i=0;i<=26;i++)line.push(fn(i/26));
  tube(seams,line,.0045,materials.sailShade,'sloop-v2-sail-panel-seam-'+label,28);
 };
 if(triangular){
  edge('luff',t=>pointAt(0,t));
  edge('leech',t=>pointAt(1,t));
  edge('head',t=>pointAt(t,1));
 }else{
  edge('luff',t=>pointAt(0,t));edge('leech',t=>pointAt(1,t));
  edge('head',t=>pointAt(t,1));edge('foot',t=>pointAt(t,0));
  for(let i=1;i<=3;i++)seam('reef-'+i,t=>pointAt(t,i/4));
 }
 const pivot=points[0].clone(),pivotGroup=new THREE.Group();
 pivotGroup.name=name+'-animation-pivot';pivotGroup.position.copy(pivot);
 for(const child of [...sail.children]){
  sail.remove(child);child.position.sub(pivot);pivotGroup.add(child);
 }
 sail.add(pivotGroup);
 sail.userData.sailControl.pivotPoint=pivot.toArray();
 sail.userData.sailControl.pivotGroup=pivotGroup;
 sail.userData.animationPivot=pivotGroup;
 sail.userData.windControl={kind:'sail'};
 return sail;
}
