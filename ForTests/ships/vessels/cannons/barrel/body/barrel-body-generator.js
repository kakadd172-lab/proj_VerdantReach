export function buildBarrelBody(ctx, dimensions) {
 const {part, mesh, THREE, materials} = ctx;
 const {barrelLength, bodyRadius, muzzleRadiusFactor, breechRadiusFactor, barrelCenterY} = dimensions;
 const half = barrelLength * .5;
 const muzzleRadius = bodyRadius * muzzleRadiusFactor;
 const breechRadius = bodyRadius * breechRadiusFactor;
 const body = part('barrel-body');
 body.userData.cannonComponent = 'barrel-body';

 // A turned exterior silhouette: narrow chase, swelling reinforce and
 // moulded muzzle/breech transitions. The LatheGeometry is capped at both
 // ends, so this is a solid, deliberately non-functional display barrel.
 const profile = [
  new THREE.Vector2(0, -half),
  new THREE.Vector2(muzzleRadius*.78, -half),
  new THREE.Vector2(muzzleRadius*.97, -half+.025*barrelLength),
  new THREE.Vector2(muzzleRadius, -half+.065*barrelLength),
  new THREE.Vector2(muzzleRadius*.96, -half+.105*barrelLength),
  new THREE.Vector2(bodyRadius*.88, -half+.18*barrelLength),
  new THREE.Vector2(bodyRadius*.78, -half+.38*barrelLength),
  new THREE.Vector2(bodyRadius*.76, -half+.58*barrelLength),
  new THREE.Vector2(bodyRadius*.83, -half+.72*barrelLength),
  new THREE.Vector2(bodyRadius*.94, -half+.80*barrelLength),
  new THREE.Vector2(breechRadius, -half+.86*barrelLength),
  new THREE.Vector2(breechRadius*1.015, -half+.94*barrelLength),
  new THREE.Vector2(breechRadius*.98, half-.035*barrelLength),
  new THREE.Vector2(breechRadius*.88, half),
  new THREE.Vector2(0, half)
 ];
 const geometry = new THREE.LatheGeometry(profile, 72);
 geometry.computeVertexNormals();
 const barrel = mesh(body, geometry, materials.iron, 'turned-solid-barrel-shell');
 barrel.rotation.x = Math.PI/2;
 barrel.position.y = barrelCenterY;
 barrel.castShadow = true;
 barrel.receiveShadow = true;
 body.userData.solidMuzzle = true;
 body.userData.axis = 'forward-negative-z';
 return body;
}
