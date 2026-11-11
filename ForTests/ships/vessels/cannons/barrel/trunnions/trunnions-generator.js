export function buildTrunnions(ctx, dimensions) {
 const {part, mesh, THREE, materials} = ctx;
 const {barrelLength, bodyRadius, barrelCenterY, carriageWidth} = dimensions;
 const z = barrelLength*.205;
 const mountY = barrelCenterY - bodyRadius*.16;
 const span = Math.max(.22, carriageWidth*.29);
 const created = [];
 for (const [side, label] of [[-1,'port'],[1,'starboard']]) {
  const group = part('trunnion-'+label);
  group.userData.cannonComponent = 'trunnion';
  const pin = mesh(group,
   new THREE.CylinderGeometry(bodyRadius*.34, bodyRadius*.34, span, 28),
   materials.iron, 'trunnion-'+label+'-solid-stud');
  pin.rotation.z = Math.PI/2;
  pin.position.set(side*span*.25, mountY, z);
  const collar = mesh(group,
   new THREE.TorusGeometry(bodyRadius*.36, bodyRadius*.055, 8, 32),
   materials.brass, 'trunnion-'+label+'-collar');
  collar.rotation.y = Math.PI/2;
  collar.position.set(side*span*.38, mountY, z);
  created.push(group);
 }
 return created;
}
