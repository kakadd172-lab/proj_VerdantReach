export function buildCarriageAxles(ctx, dimensions) {
 const {part, mesh, THREE, materials} = ctx;
 const {barrelLength, carriageWidth, wheelRadius} = dimensions;
 const groups = [];
 for (const [station,label] of [[-.205,'fore'],[.205,'aft']]) {
  const group = part('carriage-axle-'+label);
  group.userData.cannonComponent = 'fixed-wheel-spindle';
  const axle = mesh(group,
   new THREE.CylinderGeometry(.065,.065,carriageWidth*1.12,20),
   materials.iron, 'solid-axle-shaft');
  axle.rotation.z = Math.PI/2;
  axle.position.set(0,wheelRadius,station*barrelLength);
  groups.push(group);
 }
 return groups;
}
