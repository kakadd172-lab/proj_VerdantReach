import { deckY, V } from '../../architecture/hull-geometry.js';
export function buildStern(d,ctx){
  const {THREE,part,box,beam,materials,mesh}=ctx,stern=part('sternworks');
  const gallery=part('stern-gallery',stern),windows=part('stern-windows',stern),sideWindows=part('stern-side-windows',stern);
  const tiers=d.sternTiers||[],baseDeck=deckY(d,.94);let rise=0;
  tiers.forEach((tier,index)=>{
    const group=part('stern-tier-'+(index+1)),width=d.beamUnits*tier.w*(1-index*.045),depth=d.hullLengthUnits*tier.d*(1-index*.035),height=tier.h*(4/3),baseY=baseDeck+rise,centerZ=d.hullLengthUnits*(.405+index*.018),z0=centerZ-depth*.5;
    const profile=new THREE.Shape();profile.moveTo(0,0);profile.lineTo(0,height*.58);profile.quadraticCurveTo(depth*.035,height*.98,depth*.14,height*.98);profile.lineTo(depth*.28,height*.90);profile.lineTo(depth*.43,height*.76);profile.lineTo(depth*.58,height*.62);profile.lineTo(depth*.73,height*.49);profile.lineTo(depth*.88,height*.37);profile.lineTo(depth,height*.29);profile.lineTo(depth,0);profile.closePath();
    const bevel=Math.max(.025,Math.min(width,height,depth)*.022),geometry=new THREE.ExtrudeGeometry(profile,{depth:width,steps:1,curveSegments:10,bevelEnabled:true,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel});
    geometry.rotateY(-Math.PI/2);const vertices=geometry.attributes.position;
    for(let v=0;v<vertices.count;v++){const along=THREE.MathUtils.clamp(vertices.getZ(v)/depth,0,1);vertices.setX(v,vertices.getX(v)*(1-.16*along));}
    vertices.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.translate(width*.5,baseY,z0);
    mesh(group,geometry,materials.hull,'war-galleon-bevelled-sterncastle-tier');
    const count=Math.max(3,Math.round(width/1.05)),paneW=Math.max(.22,width*.055),paneH=Math.max(.18,height*.13),faceZ=z0+depth+bevel,paneY=baseY+height*.16;
    for(let n=0;n<count;n++){const x=-width*.31+width*.62*n/Math.max(1,count-1),pane=box(windows,paneW,paneH,.035,materials.glass,'stern-window');pane.position.set(x,paneY,faceZ);const hx=paneW*.62,hy=paneH*.62,fz=faceZ+.025;
      beam(windows,V(x-hx,paneY-hy,fz),V(x+hx,paneY-hy,fz),.017,materials.brass,'stern-window-sill');beam(windows,V(x-hx,paneY+hy,fz),V(x+hx,paneY+hy,fz),.017,materials.brass,'stern-window-head');beam(windows,V(x-hx,paneY-hy,fz),V(x-hx,paneY+hy,fz),.017,materials.trim,'stern-window-jamb');beam(windows,V(x+hx,paneY-hy,fz),V(x+hx,paneY+hy,fz),.017,materials.trim,'stern-window-jamb');}
    for(const side of [-1,1]){
      for(let n=0;n<3;n++){const along=.20+n*.29,z=z0+depth*along,x=side*(width*(.47-.05*along)+.035),y=baseY+height*.41,paneW2=Math.max(.22,depth*.075),paneH2=Math.max(.20,height*.14),pane=box(sideWindows,.035,paneH2*.78,paneW2*.78,materials.glass,'stern-side-window');pane.position.set(x,y,z);const fx=x+side*.026,hz=paneW2*.5,hy=paneH2*.5;
        beam(sideWindows,V(fx,y-hy,z-hz),V(fx,y-hy,z+hz),.017,materials.brass,'gallery-window-sill');beam(sideWindows,V(fx,y+hy,z-hz),V(fx,y+hy,z+hz),.017,materials.brass,'gallery-window-head');beam(sideWindows,V(fx,y-hy,z-hz),V(fx,y+hy,z-hz),.017,materials.trim,'gallery-window-jamb');beam(sideWindows,V(fx,y-hy,z+hz),V(fx,y+hy,z+hz),.017,materials.trim,'gallery-window-jamb');}
      const walkway=box(group,.20,.085,depth*1.12,materials.deck,'war-galleon-side-gallery-walkway');walkway.position.set(side*width*.51,baseY+height*.30,centerZ+depth*.04);
      const railX=side*width*.60,railY=baseY+height*.37;beam(gallery,V(railX,railY,centerZ-depth*.55),V(railX,railY,centerZ+depth*.55),.032,materials.trim,'side-gallery-top-rail');beam(gallery,V(railX,railY-.13,centerZ-depth*.55),V(railX,railY-.13,centerZ+depth*.55),.021,materials.trim,'side-gallery-lower-rail');
      for(let n=0;n<5;n++){const z=centerZ-depth*.46+n*depth*.23;beam(gallery,V(side*width*.40,baseY+height*.17,z),V(side*width*.54,baseY+height*.30,z),.038,materials.trim,'gallery-cantilever-support');beam(gallery,V(railX,railY-.15,z),V(railX,railY+.02,z),.019,materials.trim,'side-gallery-baluster');beam(gallery,V(side*width*.43,baseY+height*.18,z),V(side*width*.43,baseY+height*.79,z),.044,materials.trim,'stern-side-pilaster');}
    }
    const balcony=box(group,width*1.08,.08,depth*1.08,materials.deck,'war-galleon-aft-balcony');balcony.position.set(0,baseY+height*.10,centerZ+depth*.20);
    beam(gallery,V(-width*.53,baseY+height*.16,centerZ+depth*.72),V(width*.53,baseY+height*.16,centerZ+depth*.72),.03,materials.trim,'aft-gallery-rail');
    rise+=height*.83+.10;
  });
  const quarterdeck=part('quarterdeck',stern),platform=box(quarterdeck,d.beamUnits*.74,.16,d.hullLengthUnits*.18,materials.deck,'raised-quarterdeck-platform');
  platform.position.set(0,baseDeck+.20,d.hullLengthUnits*.335);
}
