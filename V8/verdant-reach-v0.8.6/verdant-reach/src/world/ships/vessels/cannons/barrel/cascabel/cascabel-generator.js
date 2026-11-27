export function buildCascabel(ctx, dimensions) {
 const {part, mesh, beam, THREE, materials} = ctx;
 const {barrelLength, bodyRadius, barrelCenterY} = dimensions;
 const group = part('cascabel');
 group.userData.cannonComponent = 'decorative-breech-finial';
 const z = barrelLength*.5;
 const neckRadius = bodyRadius*.27;
 beam(group, [0,barrelCenterY,z-.015], [0,barrelCenterY,z+.16], neckRadius,
  materials.brass, 'cascabel-neck', 24);
 const collar = mesh(group,
  new THREE.TorusGeometry(neckRadius*1.12, neckRadius*.17, 8, 28),
  materials.brass, 'cascabel-neck-moulding');
 collar.position.set(0,barrelCenterY,z+.09);
 const knob = mesh(group,
  new THREE.SphereGeometry(bodyRadius*.38, 28, 20),
  materials.brass, 'rounded-cascabel-knob');
 knob.position.set(0,barrelCenterY,z+.205);
 knob.scale.set(1,1,1.18);
 return group;
}
