import { deckY,keelY,rudderStockPosition,transomZAtY,V } from '../../architecture/hull-geometry.js';

/**
 * Fixed transom hardware for the outboard rudder.
 * Gudgeons belong to the stern; the pintle stock and blade belong to the
 * separate rotating rudder component.
 */
export function buildRudderFittings(d,ctx){
 const {THREE,part,mesh,beam,box,materials}=ctx;
 const fittings=part('rudder-gudgeons');
 const stock=rudderStockPosition(d);
 const bladeHeight=Math.max(1.0,stock.y-keelY(d,1)+.20);
 const stations=[.18,.62].map(fraction=>({
  fraction,
  y:stock.y-bladeHeight*fraction
 }));
 const mounts=[];

 for(const [index,station] of stations.entries()){
  const y=station.y;
  const transomZ=transomZAtY(d,y);
  const plateZ=transomZ+.012;
  const plate=box(fittings,.20,.13,.028,materials.iron,
   'transom-gudgeon-backing-plate-'+(index+1));
  plate.position.set(0,y,plateZ);

  for(const side of [-1,1]){
   const bolt=mesh(fittings,new THREE.SphereGeometry(.018,8,6),materials.brass,
    'gudgeon-fastener-'+(index+1)+'-'+side);
   bolt.position.set(side*.066,y,plateZ+.018);
  }

  // Paired forged brackets carry the bearing sleeve back into the transom.
  for(const side of [-1,1]){
   beam(fittings,V(side*.082,y,plateZ+.018),
    V(side*.038,y,stock.z-.045),.020,materials.iron,
    'gudgeon-support-arm-'+(index+1)+'-'+side,10);
  }

  // Open bearing sleeve leaves the rudder's vertical pintle visible through it.
  const sleeve=mesh(fittings,
   new THREE.CylinderGeometry(.050,.050,.14,16,1,true),
   materials.brass,'gudgeon-bearing-sleeve-'+(index+1));
  sleeve.position.set(stock.x,y,stock.z);
  const upperLip=mesh(fittings,new THREE.TorusGeometry(.050,.010,8,18),
   materials.iron,'gudgeon-bearing-lip-top-'+(index+1));
  upperLip.rotation.x=Math.PI/2;
  upperLip.position.set(stock.x,y+.068,stock.z);
  const lowerLip=mesh(fittings,new THREE.TorusGeometry(.050,.010,8,18),
   materials.iron,'gudgeon-bearing-lip-bottom-'+(index+1));
  lowerLip.rotation.x=Math.PI/2;
  lowerLip.position.set(stock.x,y-.068,stock.z);

  mounts.push({fraction:station.fraction,position:[stock.x,y,stock.z],
   transomAnchor:[0,y,transomZ],sleeveHeight:.14,sleeveRadius:.050});
 }

 fittings.userData.rudderFittingsType='fixed-transom-gudgeons';
 fittings.userData.gudgeonMounts=mounts;
 fittings.userData.stockAxis='vertical-y';
 return fittings;
}
