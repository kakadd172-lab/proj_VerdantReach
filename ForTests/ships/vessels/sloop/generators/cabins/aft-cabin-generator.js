import { deckY, stationZ, V } from "../../architecture/hull-geometry.js";

export function ensureSternTierComponents(d,ctx){
  const {part,box,materials,beam,V}=ctx;
  const tiers=d.sternTiers||[];
  tiers.forEach((tier,index)=>{
    const name='stern-tier-'+(index+1);
    if(ctx.registry.has(name))return;
    const component=part(name);
    const width=d.beamUnits*tier.w*0.66;
    const height=Math.max(0.18,tier.h*0.62);
    const depth=Math.max(0.16,d.hullLengthUnits*tier.d);
    const centerY=deckY(d,0.94)+height*(0.43+index*0.07),baseY=centerY-height*0.5;
    const centerZ=stationZ(d,0.94,1),z0=centerZ-depth*0.5;
    const profile=new ctx.THREE.Shape();
    profile.moveTo(0,0);
    profile.lineTo(0,height*0.67);
    profile.quadraticCurveTo(depth*0.035,height*0.94,depth*0.13,height*0.96);
    profile.lineTo(depth*0.25,height*0.91);
    profile.lineTo(depth*0.38,height*0.80);
    profile.lineTo(depth*0.51,height*0.67);
    profile.lineTo(depth*0.64,height*0.54);
    profile.lineTo(depth*0.78,height*0.42);
    profile.lineTo(depth*0.91,height*0.34);
    profile.lineTo(depth,height*0.28);
    profile.lineTo(depth,0);
    profile.closePath();
    const bevel=Math.min(0.026,width*0.008,height*0.023);
    const geometry=new ctx.THREE.ExtrudeGeometry(profile,{depth:width,steps:1,curveSegments:6,bevelEnabled:true,bevelSegments:2,bevelSize:bevel,bevelThickness:bevel});
    geometry.rotateY(-Math.PI/2);
    geometry.translate(width*0.5,baseY,z0);
    geometry.computeVertexNormals();
    ctx.mesh(component,geometry,materials.hull,'sloop-folded-aft-cabin-shell');

    const foldStations=[[0,0.67],[0.13,0.96],[0.25,0.91],[0.38,0.80],[0.51,0.67],[0.64,0.54],[0.78,0.42],[0.91,0.34],[1,0.28]];
    const ribRadius=Math.max(0.015,d.beamUnits*0.002);
    for(let fold=0;fold<foldStations.length;fold++){
      const [along,rise]=foldStations[fold],z=z0+depth*along,y=baseY+height*rise;
      if(fold>0){
        const [prevAlong,prevRise]=foldStations[fold-1];
        const prevZ=z0+depth*prevAlong,prevY=baseY+height*prevRise;
        for(const side of [-1,1]){
          beam(component,V(side*width*0.505,prevY,prevZ),V(side*width*0.505,y,z),ribRadius,materials.trim,'folded-cabin-side-rib');
        }
      }
      if(fold>0&&fold<foldStations.length-1){
        beam(component,V(-width*0.51,y,z),V(width*0.51,y,z),ribRadius*0.8,materials.trim,'folded-cabin-cross-rib');
      }
    }

    const paneW=Math.max(0.14,depth*0.12),paneH=Math.max(0.13,height*0.17);
    const paneY=baseY+height*0.33,paneZ=z0+depth*0.17;
    for(const side of [-1,1]){
      const x=side*(width*0.5+0.016),pane=box(component,0.032,paneH,paneW,materials.glass,'cabin-side-window');
      pane.position.set(x,paneY,paneZ);
      const fx=side*(width*0.5+0.038),y0=paneY-paneH*0.58,y1=paneY+paneH*0.58,zA=paneZ-paneW*0.58,zB=paneZ+paneW*0.58;
      beam(component,V(fx,y0,zA),V(fx,y0,zB),ribRadius*0.8,materials.trim,'cabin-window-frame');
      beam(component,V(fx,y1,zA),V(fx,y1,zB),ribRadius*0.8,materials.trim,'cabin-window-frame');
      beam(component,V(fx,y0,zA),V(fx,y1,zA),ribRadius*0.8,materials.trim,'cabin-window-frame');
      beam(component,V(fx,y0,zB),V(fx,y1,zB),ribRadius*0.8,materials.trim,'cabin-window-frame');
    }
  });
}
