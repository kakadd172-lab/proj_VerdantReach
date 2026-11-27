export function buildCarriageCheeks(ctx, dimensions) {
 const {part, mesh, THREE, materials} = ctx;
 const {barrelLength, bodyRadius, barrelCenterY, wheelRadius, carriageWidth, carriageLength} = dimensions;
 const thickness = Math.max(.105, bodyRadius*.60);
 const zFront = -carriageLength*.48, zRear = carriageLength*.49;
 const lowerY = wheelRadius*.63;
 const upperY = barrelCenterY-bodyRadius*.56;
 const shape = new THREE.Shape();
 // Shape X becomes world -Z after the quarter-turn below.
 shape.moveTo(-zFront, lowerY+.10);
 shape.lineTo(-zFront, upperY*.82);
 shape.quadraticCurveTo(-zFront*.55, upperY*1.03, -zFront*.15, upperY*.91);
 shape.lineTo(-zRear*.74, upperY*.96);
 shape.quadraticCurveTo(-zRear*1.08, upperY*.93, -zRear, upperY*.70);
 shape.lineTo(-zRear*.96, lowerY+.08);
 shape.quadraticCurveTo(0, lowerY-.035, -zFront*.88, lowerY);
 shape.closePath();
 const geometry = new THREE.ExtrudeGeometry(shape, {
  depth: thickness, steps: 1, curveSegments: 12,
  bevelEnabled: true, bevelSegments: 2, bevelSize: .022, bevelThickness: .018
 });
 geometry.computeVertexNormals();
 const groups = [];
 for (const [side,label] of [[-1,'port'],[1,'starboard']]) {
  const group = part('carriage-cheek-'+label);
  group.userData.cannonComponent = 'wooden-side-cheek';
  const cheek = mesh(group, geometry.clone(), materials.plank, 'sculpted-oak-cheek');
  cheek.rotation.y = Math.PI/2;
  // Keep both extrusions on their own side of the carriage centre.
  cheek.position.x = side*carriageWidth*.36-thickness*.5;
  cheek.castShadow = true;
  const topRail = mesh(group,
   new THREE.BoxGeometry(thickness*.45, .065, carriageLength*.78),
   materials.trim, 'cheek-top-rail');
  topRail.position.set(cheek.position.x+thickness*.5, upperY*.87, 0);
  groups.push(group);
 }
 return groups;
}
