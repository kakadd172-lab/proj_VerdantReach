export function buildReinforcementRings(ctx, dimensions) {
 const {part, mesh, THREE, materials} = ctx;
 const {barrelLength, bodyRadius, barrelCenterY, breechRadiusFactor} = dimensions;
 const definitions = [
  ['muzzle-band', -.405, bodyRadius*1.005, .036],
  ['chase-band', -.045, bodyRadius*.785, .025],
  ['reinforce-band-forward', .185, bodyRadius*.865, .033],
  ['reinforce-band-aft', .365, bodyRadius*1.03, .043],
  ['breech-band', .465, bodyRadius*breechRadiusFactor*.99, .048]
 ];
 const created = [];
 for (const [name, station, radius, thickness] of definitions) {
  const group = part(name);
  group.userData.cannonComponent = 'reinforcement-ring';
  const ring = mesh(group, new THREE.TorusGeometry(radius, thickness, 10, 56),
   materials.brass, name+'-turned-hoop');
  ring.position.set(0, barrelCenterY, station*barrelLength);
  created.push(group);
 }
 return created;
}
