import { deckY, keelY, halfBreadth, hullPoint, V } from "../../architecture/hull-geometry.js";
export function buildStern(d,ctx){
 const {part,box,beam,materials,V,THREE,mesh}=ctx;
 const stern=part('sternworks'),gallery=part('stern-gallery',stern);
 const windows=part('stern-windows',stern),sideWindows=part('stern-side-windows',stern);
 const baseZ=d.hullLengthUnits*0.355,deck=deckY(d,.94),tiers=d.sternTiers||[];
 tiers.forEach((tier,index)=>{
  const tierGroup=part('stern-tier-'+(index+1));
  const width=d.beamUnits*tier.w*(1-index*.055)*1;
  const depth=d.hullLengthUnits*tier.d*(1-index*.035);
  const height=tier.h*(4/3);
  const baseY=deck+tiers.slice(0,index).reduce((sum,item)=>sum+item.h*(4/3)+.08,0);
  const centerZ=baseZ+index*depth*.22,z0=centerZ-depth*.5;
  const profile=new THREE.Shape();
  profile.moveTo(0,0);
  profile.lineTo(0,height*.62);
  profile.quadraticCurveTo(depth*.045,height*.98,depth*.15,height*.98);
  profile.lineTo(depth*.27,height*.91);
  profile.lineTo(depth*.39,height*.79);
  profile.lineTo(depth*.52,height*.66);
  profile.lineTo(depth*.65,height*.54);
  profile.lineTo(depth*.78,height*.43);
  profile.lineTo(depth*.90,height*.34);
  profile.lineTo(depth,height*.27);
  profile.lineTo(depth,0);
  profile.closePath();
  const bevel=Math.max(.026,Math.min(width,height,depth)*.024);
  const geometry=new THREE.ExtrudeGeometry(profile,{
   depth:width,steps:1,curveSegments:8,bevelEnabled:true,bevelSegments:3,
   bevelSize:bevel,bevelThickness:bevel
  });
  geometry.rotateY(-Math.PI/2);
  const vertices=geometry.attributes.position;
  for(let vertex=0;vertex<vertices.count;vertex++){
   const along=THREE.MathUtils.clamp(vertices.getZ(vertex)/depth,0,1);
   const taper=1-.18*along;
   vertices.setX(vertex,vertices.getX(vertex)*taper);
  }
  vertices.needsUpdate=true;
  geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  geometry.translate(width*.5,baseY,z0);
  mesh(tierGroup,geometry,materials.hull,'galleon-folded-back-cabin-tier');
  const folds=[[0,.62],[.15,.98],[.27,.91],[.39,.79],[.52,.66],[.65,.54],[.78,.43],[.90,.34],[1,.27]];
  const rib=Math.max(.019,d.beamUnits*.0023);
  for(let fold=1;fold<folds.length;fold++){
   const [prevAlong,prevRise]=folds[fold-1],[along,rise]=folds[fold];
   const prevZ=z0+depth*prevAlong,z=z0+depth*along;
   const prevY=baseY+height*prevRise,y=baseY+height*rise;
   const prevTaper=1-.18*prevAlong,taper=1-.18*along;
   for(const side of [-1,1]){
    beam(tierGroup,V(side*width*.5*prevTaper,prevY,prevZ),V(side*width*.5*taper,y,z),rib,materials.trim,'folded-cabin-side-rib');
   }
   if(fold<folds.length-1){
    beam(tierGroup,V(-width*.5*taper,y,z),V(width*.5*taper,y,z),rib*.8,materials.trim,'folded-cabin-cross-rib');
   }
  }
  const bandY=baseY+height*.12,bandZ=z0+depth*.985;
  beam(gallery,V(-width*.42,bandY,bandZ),V(width*.42,bandY,bandZ),.028,materials.trim,'stern-moulding');
  const transomCount=Math.max(2,Math.round(width/1.3));
  const transomW=Math.max(.20,width*.05),transomH=Math.max(.16,height*.13);
  const transomY=baseY+height*.14,faceZ=z0+depth+bevel*.8;
  for(let n=0;n<transomCount;n++){
   const x=-width*.30+width*.60*n/Math.max(1,transomCount-1);
   const pane=box(windows,transomW,transomH,.04,materials.glass,'stern-window');
   pane.position.set(x,transomY,faceZ);
   const fx=transomW*.62,fy=transomH*.62,fz=faceZ+.025;
   beam(windows,V(x-fx,transomY-fy,fz),V(x+fx,transomY-fy,fz),.016,materials.brass,'stern-window-sill');
   beam(windows,V(x-fx,transomY+fy,fz),V(x+fx,transomY+fy,fz),.016,materials.brass,'stern-window-head');
   beam(windows,V(x-fx,transomY-fy,fz),V(x-fx,transomY+fy,fz),.016,materials.trim,'stern-window-jamb');
   beam(windows,V(x+fx,transomY-fy,fz),V(x+fx,transomY+fy,fz),.016,materials.trim,'stern-window-jamb');
  }
  for(const side of [-1,1]){
   const sideWindowStations=[.18,.34,.50];
   for(let windowIndex=0;windowIndex<sideWindowStations.length;windowIndex++){
    const along=sideWindowStations[windowIndex],z=z0+depth*along,taper=1-.18*along;
    const x=side*(width*.48*taper+.035),y=baseY+height*.38;
    const paneDepth=Math.max(.24,depth*.095),paneHeight=Math.max(.22,height*.17);
    const pane=box(sideWindows,.04,paneHeight*.76,paneDepth*.76,materials.glass,'stern-side-window');
    pane.position.set(x,y,z);
    const fx=x+side*.03,halfZ=paneDepth*.5,halfY=paneHeight*.5;
    beam(sideWindows,V(fx,y-halfY,z-halfZ),V(fx,y-halfY,z+halfZ),.018,materials.brass,'gallery-window-sill');
    beam(sideWindows,V(fx,y+halfY,z-halfZ),V(fx,y+halfY,z+halfZ),.018,materials.brass,'gallery-window-head');
    beam(sideWindows,V(fx,y-halfY,z-halfZ),V(fx,y+halfY,z-halfZ),.018,materials.trim,'gallery-window-jamb');
    beam(sideWindows,V(fx,y-halfY,z+halfZ),V(fx,y+halfY,z+halfZ),.018,materials.trim,'gallery-window-jamb');
   }
   const galleryDeck=box(tierGroup,.18,.075,depth*1.12,materials.deck,'war-galleon-2-side-gallery-walkway');
   galleryDeck.position.set(side*width*.50,baseY+height*.30,centerZ+depth*.05);
   const railX=side*width*.59,railY=baseY+height*.36;
   beam(gallery,V(railX,railY,centerZ-depth*.55),V(railX,railY,centerZ+depth*.55),.032,materials.trim,'side-gallery-top-rail');
   beam(gallery,V(railX,railY-.12,centerZ-depth*.55),V(railX,railY-.12,centerZ+depth*.55),.022,materials.trim,'side-gallery-lower-rail');
   for(let support=0;support<5;support++){
    const z=centerZ-depth*.46+support*depth*.23;
    beam(gallery,V(side*width*.40,baseY+height*.17,z),V(side*width*.53,baseY+height*.30,z),.038,materials.trim,'gallery-cantilever-support');
    beam(gallery,V(railX,railY-.15,z),V(railX,railY+.02,z),.020,materials.trim,'side-gallery-baluster');
    beam(gallery,V(side*width*.44,baseY+height*.18,z),V(side*width*.44,baseY+height*.82,z),.048,materials.trim,'stern-side-pilaster');
   }
  }
  const balcony=box(tierGroup,width*1.08,.075,depth*1.10,materials.deck,'galleon-stern-gallery-balcony');
  balcony.position.set(0,baseY+height*.105,centerZ+depth*.21);
  beam(gallery,V(-width*.53,baseY+height*.16,centerZ+depth*.75),V(width*.53,baseY+height*.16,centerZ+depth*.75),.032,materials.trim,'aft-balcony-rail');
  for(let post=-2;post<=2;post++){
   const x=post*width*.21;
   beam(gallery,V(x,baseY+height*.09,centerZ+depth*.75),V(x,baseY+height*.19,centerZ+depth*.75),.020,materials.trim,'aft-balcony-post');
  }
 });
}
