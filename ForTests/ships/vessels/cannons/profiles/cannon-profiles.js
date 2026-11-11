export const CANNON_PROFILE_VERSION = '0.1.0';

const freeze = value => {
 if (!value || typeof value !== 'object') return value;
 Object.freeze(value);
 for (const child of Object.values(value)) freeze(child);
 return value;
};

// External silhouette profiles are traced proportionally from the supplied
// historical side/elevation sheets. Dimensions are display-model references,
// not manufacturing or functional weapon specifications.
export const CANNON_PROFILES = freeze({
 '36-pounder': {
  id:'36-pounder', label:'36-pounder naval cannon', calibreMm:174,
  barrelLengthMetres:2.925, bodyRadiusMetres:.235,
  muzzleRadiusFactor:1.12, breechRadiusFactor:1.12,
  wheelRadiusMetres:.455, carriageWidthMetres:1.18,
  carriageLengthFactor:.80, carriageHeightFactor:.73
 },
 '18-pounder': {
  id:'18-pounder', label:'18-pounder naval cannon', calibreMm:138,
  barrelLengthMetres:2.600, bodyRadiusMetres:.202,
  muzzleRadiusFactor:1.13, breechRadiusFactor:1.13,
  wheelRadiusMetres:.395, carriageWidthMetres:1.04,
  carriageLengthFactor:.81, carriageHeightFactor:.73
 },
 '9-pounder': {
  id:'9-pounder', label:'9-pounder naval cannon', calibreMm:106,
  barrelLengthMetres:2.221, bodyRadiusMetres:.166,
  muzzleRadiusFactor:1.14, breechRadiusFactor:1.14,
  wheelRadiusMetres:.337, carriageWidthMetres:.91,
  carriageLengthFactor:.82, carriageHeightFactor:.72
 }
});

export function getCannonProfile(id='18-pounder') {
 const profile = CANNON_PROFILES[String(id || '18-pounder')];
 return profile ? {...profile} : null;
}
