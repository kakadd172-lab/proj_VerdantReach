export function buildCarriageTransoms(ctx, dimensions) {
 const {part, box, materials} = ctx;
 const {barrelLength, bodyRadius, carriageWidth, carriageLength, wheelRadius} = dimensions;
 const created = [];
 for (const [station,label] of [[-.34,'fore'],[.34,'aft']]) {
  const group = part('carriage-transom-'+label);
  group.userData.cannonComponent = 'cross-carriage-timber';
  const beam = box(group, carriageWidth*.70, bodyRadius*.48, bodyRadius*.54,
   materials.plank, 'transom-crosspiece');
  beam.position.set(0, wheelRadius*.78, station*carriageLength);
  created.push(group);
 }
 return created;
}
