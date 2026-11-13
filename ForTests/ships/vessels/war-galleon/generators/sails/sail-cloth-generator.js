import { V } from '../../architecture/hull-geometry.js';
export function buildCanvasSail(ctx,name,mastId,corners,fullness,parent,axis){
  const {THREE,part,mesh,materials}=ctx,control=part(name,parent||ctx.root);
  control.userData.sailControl={mastId,clothPart:'cloth-'+name};
  const cloth=part('cloth-'+name,control),points=corners.map(p=>p?.isVector3?p.clone():V(...p));
  const span=(points[0].distanceTo(points[3])+points[1].distanceTo(points[2]))*.5,height=(points[0].distanceTo(points[1])+points[3].distanceTo(points[2]))*.5;
  const profile={camber:1.13,chord:1.10,vertical:.91,twist:.026},reference=Math.max(.45,span,height*.54),bulge=reference*THREE.MathUtils.clamp(fullness??.095,.035,.15)*profile.camber;
  const rows=20,columns=26,positions=[],indices=[];
  for(let row=0;row<=rows;row++){const v=row/rows;for(let col=0;col<=columns;col++){const u=col/columns,lower=points[0].clone().lerp(points[3],u),upper=points[1].clone().lerp(points[2],u),p=lower.lerp(upper,v),chord=Math.pow(Math.max(0,Math.sin(Math.PI*u)),profile.chord),vertical=Math.pow(Math.max(0,Math.sin(Math.PI*v)),profile.vertical),belly=bulge*chord*vertical,twist=reference*profile.twist*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*(v-.5);if(axis==='x'){p.x+=belly;p.z+=twist;}else{p.z+=belly;p.x+=twist;}positions.push(p.x,p.y,p.z);}}
  const stride=columns+1;for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){const a=row*stride+col;indices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const sail=mesh(cloth,geometry,materials.sail,'sail-shaped-cloth');sail.userData.sailCloth={rows,columns,axis:axis||'z'};
  const seams=part('panel-seams-'+name,control);
  for(let seam=1;seam<=3;seam++){const line=[],v=seam/4;for(let i=0;i<=24;i++){const index=(Math.round(v*rows)*stride+Math.round(i/24*columns))*3;line.push(V(positions[index],positions[index+1],positions[index+2]));}ctx.tube(seams,line,.006,materials.sailShade,'reef-seam-'+seam,28);}
  return control;
}
