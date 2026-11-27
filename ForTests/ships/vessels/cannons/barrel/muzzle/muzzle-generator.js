export function buildMuzzle(ctx, dimensions) {
 const {part, mesh, THREE, materials} = ctx;
 const {barrelLength, bodyRadius, muzzleRadiusFactor, barrelCenterY} = dimensions;
 const radius = bodyRadius * muzzleRadiusFactor;
 const muzzle = part('muzzle-face');
 muzzle.userData.cannonComponent = 'sealed-muzzle';
 const rim = mesh(muzzle,
  new THREE.TorusGeometry(radius*.94, Math.max(.018, bodyRadius*.075), 12, 56),
  materials.brass, 'muzzle-moulding');
 rim.position.set(0, barrelCenterY, -barrelLength*.5+.025);
 const cap = mesh(muzzle,
  new THREE.CircleGeometry(radius*.78, 56),
  materials.lower, 'solid-sealed-muzzle-face');
 cap.position.set(0, barrelCenterY, -barrelLength*.5-.002);
 cap.userData.solidCap = true;
 muzzle.userData.noBore = true;
 return muzzle;
}
