export function buildCarriageBed(ctx, dimensions) {
 const {part, box, materials} = ctx;
 const {barrelLength, bodyRadius, barrelCenterY, carriageWidth, carriageLength, wheelRadius} = dimensions;
 const group = part('carriage-bed');
 group.userData.cannonComponent = 'fixed-wooden-bed';
 const bedY = wheelRadius*.70;
 for (const [i, xSide] of [-1,1].entries()) {
  const rail = box(group, bodyRadius*.62, bodyRadius*.42, carriageLength*.82,
   materials.trim, 'longitudinal-bed-rail-'+(i+1));
  rail.position.set(xSide*carriageWidth*.24, bedY, 0);
 }
 const central = box(group, carriageWidth*.45, bodyRadius*.40, carriageLength*.48,
  materials.plank, 'solid-bed-plank');
 central.position.set(0, bedY+.025, barrelLength*.015);
 const saddle = box(group, carriageWidth*.48, bodyRadius*.20, carriageLength*.30,
  materials.trim, 'barrel-rest-saddle');
 saddle.position.set(0, barrelCenterY-bodyRadius*.76, barrelLength*.13);
 return group;
}
