export function buildCarriageWheels(ctx, dimensions) {
 const {part, mesh, beam, THREE, materials} = ctx;
 const {barrelLength, wheelRadius, carriageWidth, bodyRadius} = dimensions;
 const groups = [];
 const zOffset = barrelLength*.205;
 const xOffset = carriageWidth*.36 + bodyRadius*.70;
 for (const [side,sideName] of [[-1,'port'],[1,'starboard']]) {
  for (const [station,stationName] of [[-1,'fore'],[1,'aft']]) {
   const group = part('wheel-'+sideName+'-'+stationName);
   group.userData.cannonComponent = 'fixed-wood-wheel';
   const x = side*xOffset, y = wheelRadius, z = station*zOffset;
   const disk = mesh(group,
    new THREE.CylinderGeometry(wheelRadius*.86,wheelRadius*.86,.105,40),
    materials.plank, 'solid-wood-wheel-disk');
   disk.rotation.z = Math.PI/2;
   disk.position.set(x,y,z);
   const rim = mesh(group,
    new THREE.TorusGeometry(wheelRadius*.90,wheelRadius*.085,10,48),
    materials.trim, 'wooden-wheel-rim');
   rim.rotation.y = Math.PI/2;
   rim.position.set(x,y,z);
   const hub = mesh(group,
    new THREE.CylinderGeometry(wheelRadius*.19,wheelRadius*.19,.18,24),
    materials.brass, 'decorative-wheel-hub');
   hub.rotation.z = Math.PI/2;
   hub.position.set(x,y,z);
   const hubCap = mesh(group,
    new THREE.SphereGeometry(wheelRadius*.13,16,12),
    materials.iron, 'wheel-hub-cap');
   hubCap.position.set(x+side*.105,y,z);
   for(let spoke=0;spoke<10;spoke++){
    const angle=(spoke/10)*Math.PI*2;
    const start=new THREE.Vector3(x,y+Math.cos(angle)*wheelRadius*.17,z+Math.sin(angle)*wheelRadius*.17);
    const end=new THREE.Vector3(x,y+Math.cos(angle)*wheelRadius*.82,z+Math.sin(angle)*wheelRadius*.82);
    beam(group,start,end,Math.max(.018,wheelRadius*.043),materials.plank,'wheel-spoke-'+(spoke+1),8);
   }
   groups.push(group);
  }
 }
 return groups;
}
