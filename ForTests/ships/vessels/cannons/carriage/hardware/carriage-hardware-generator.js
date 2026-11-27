export function buildCarriageHardware(ctx, dimensions) {
 const {part, mesh, THREE, materials} = ctx;
 const {carriageWidth, carriageLength, bodyRadius, wheelRadius} = dimensions;
 const groups = [];
 for(const [side,label] of [[-1,'port'],[1,'starboard']]){
  const group = part('carriage-hardware-'+label);
  group.userData.cannonComponent = 'decorative-fasteners';
  for(const z of [-carriageLength*.34,-carriageLength*.12,carriageLength*.12,carriageLength*.34]){
   for(const y of [wheelRadius*.94,wheelRadius*1.56]){
    const bolt=mesh(group,
     new THREE.SphereGeometry(bodyRadius*.075,12,10),
     materials.iron, 'cheek-fastener');
    bolt.scale.set(1,.82,.82);
    bolt.position.set(side*(carriageWidth*.36+bodyRadius*.055),y,z);
   }
  }
  const strap=mesh(group,
   new THREE.BoxGeometry(.024,bodyRadius*.22,carriageLength*.72),
   materials.iron, 'side-iron-strapping');
  strap.position.set(side*(carriageWidth*.36+bodyRadius*.052),wheelRadius*1.30,0);
  groups.push(group);
 }
 // A static oak support block under the breech gives the assembly its
 // historical silhouette. It is a fixed display detail, not an adjustable
 // elevation or firing mechanism.
 const support = part('carriage-breech-support');
 support.userData.cannonComponent = 'fixed-display-support';
 const block=mesh(support,
  new THREE.BoxGeometry(bodyRadius*1.55,bodyRadius*.48,bodyRadius*.62),
  materials.plank, 'solid-breech-support-block');
 block.position.set(0,wheelRadius*1.48,carriageLength*.20);
 return [...groups,support];
}
