import * as THREE from 'three';

export const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const clamp01 = value => Math.max(0,Math.min(1,value));
const smoothstep = value => { const t=clamp01(value); return t*t*(3-2*t); };
const UNITS_PER_METRE = 4/3;

/**
 * Half-breadth stations traced proportionally from the 1866 Loguivy
 * homardier plan view. Values are fractions of the 2.35 m maximum beam.
 * The aft run stays comparatively full and finishes in a real transom;
 * the forebody narrows gradually into the fine rising stem.
 */
const PLAN_HALF_BREADTH = Object.freeze([
  [0.00,0.018],[0.025,0.055],[0.055,0.125],[0.09,0.235],
  [0.14,0.365],[0.20,0.525],[0.28,0.690],[0.37,0.825],
  [0.46,0.915],[0.55,0.972],[0.64,1.000],[0.73,0.990],
  [0.82,0.955],[0.90,0.900],[0.96,0.835],[1.00,0.795]
]);

/** The body-plan section families: fine forefoot, full middle body, tucked aft. */
const FORE_SECTION = Object.freeze([
  [0.00,0.000],[0.08,0.035],[0.16,0.105],[0.25,0.235],
  [0.35,0.415],[0.46,0.615],[0.58,0.805],[0.70,0.945],
  [0.82,1.025],[0.92,1.055],[1.00,1.035]
]);
const MID_SECTION = Object.freeze([
  [0.00,0.000],[0.08,0.060],[0.16,0.155],[0.25,0.305],
  [0.35,0.485],[0.46,0.665],[0.58,0.830],[0.70,0.955],
  [0.82,1.025],[0.92,1.045],[1.00,1.020]
]);
const AFT_SECTION = Object.freeze([
  [0.00,0.000],[0.08,0.055],[0.16,0.145],[0.25,0.285],
  [0.35,0.465],[0.46,0.650],[0.58,0.815],[0.70,0.940],
  [0.82,1.005],[0.92,1.010],[1.00,0.985]
]);

/** Sheer rise in metres above the amidships deck datum. */
const SHEER_PROFILE = Object.freeze([
  [0.00,0.62],[0.035,0.54],[0.08,0.40],[0.15,0.245],
  [0.24,0.115],[0.36,0.035],[0.50,0.000],[0.64,0.006],
  [0.76,0.055],[0.86,0.135],[0.94,0.255],[1.00,0.34]
]);

/** Fraction of full keel-to-deck depth remaining at each station. */
const KEEL_DEPTH_PROFILE = Object.freeze([
  [0.00,0.16],[0.035,0.32],[0.08,0.52],[0.15,0.73],
  [0.24,0.88],[0.34,0.965],[0.46,1.000],[0.58,0.995],
  [0.70,0.970],[0.80,0.915],[0.89,0.805],[0.95,0.685],
  [1.00,0.610]
]);

/** Monotone, shape-preserving cubic interpolation for traced station tables. */
function tableValue(table,x){
  const t=clamp01(x),last=table.length-1;
  if(t<=table[0][0])return table[0][1];
  if(t>=table[last][0])return table[last][1];

  let i=0;
  while(i<last-1&&t>table[i+1][0])i++;
  const h=table[i+1][0]-table[i][0];
  const u=(t-table[i][0])/h;
  const delta=(k)=>(table[k+1][1]-table[k][1])/(table[k+1][0]-table[k][0]);

  const tangent=(k)=>{
    if(k===0)return delta(0);
    if(k===last)return delta(last-1);
    const h0=table[k][0]-table[k-1][0];
    const h1=table[k+1][0]-table[k][0];
    const d0=delta(k-1),d1=delta(k);
    if(d0===0||d1===0||Math.sign(d0)!==Math.sign(d1))return 0;
    const w1=2*h1+h0,w2=h1+2*h0;
    return (w1+w2)/(w1/d0+w2/d1);
  };

  const y0=table[i][1],y1=table[i+1][1];
  const m0=tangent(i)*h,m1=tangent(i+1)*h;
  const h00=2*u*u*u-3*u*u+1,h10=u*u*u-2*u*u+u;
  const h01=-2*u*u*u+3*u*u,h11=u*u*u-u*u;
  const value=h00*y0+h10*m0+h01*y1+h11*m1;
  return Math.max(Math.min(y0,y1),Math.min(Math.max(y0,y1),value));
}

export function hullShapeStation(d,t){
  // The 1866 plan has a complete hull to the aft transom; there is no
  // artificial 70% cut or shortened aft run in this reconstruction.
  return clamp01(t);
}

function sectionProfileAt(t,v){
  const station=clamp01(t),level=clamp01(v);
  const fore=tableValue(FORE_SECTION,level);
  const middle=tableValue(MID_SECTION,level);
  const aft=tableValue(AFT_SECTION,level);
  if(station<0.5){
    return middle+(fore-middle)*(1-smoothstep(station/0.5));
  }
  return middle+(aft-middle)*smoothstep((station-0.5)/0.5);
}

export function sectionBreadth(d,t,v){
  return sectionProfileAt(t,v);
}

export function halfBreadth(d,t){
  return d.beamUnits*0.5*tableValue(PLAN_HALF_BREADTH,hullShapeStation(d,t));
}

export function deckY(d,t){
  return d.deckHeightUnits + tableValue(SHEER_PROFILE,hullShapeStation(d,t))*UNITS_PER_METRE;
}

export function keelY(d,t){
  const depthUnits=d.deckHeightUnits+d.draftUnits;
  return deckY(d,t)-depthUnits*tableValue(KEEL_DEPTH_PROFILE,hullShapeStation(d,t));
}

/**
 * Longitudinal station positions include the small stem rake and stern
 * overhang visible in the side elevation. The rake is linear through depth,
 * making the terminal transom one clean plane.
 */
export function stationZ(d,t,v=1){
  const station=clamp01(t),level=clamp01(v);
  const base=(station-0.5)*d.hullLengthUnits;
  const bowRake=(d.hull.stemRake??0.035)*d.beamUnits*Math.pow(1-station,2.4)*level;
  const sternRake=(d.hull.sternRake??0.035)*d.beamUnits*Math.pow(station,3.2)*level;
  return base-bowRake+sternRake;
}

export function hullSurfacePoint(d,t,side,v){
  const station=clamp01(t),level=clamp01(v);
  const y=keelY(d,station)+(deckY(d,station)-keelY(d,station))*level;
  const x=side*halfBreadth(d,station)*sectionBreadth(d,station,level);
  return V(x,y,stationZ(d,station,level));
}

/**
 * Loft ring: the upper half closes across the deck sheer, while the lower
 * half follows the traced body-plan couples down to the keel.
 */
export function hullPoint(d,t,a){
  const angle=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  const station=clamp01(t);
  if(angle<=Math.PI){
    const across=angle/Math.PI;
    const x=(1-2*across)*halfBreadth(d,station)*sectionBreadth(d,station,1);
    return V(x,deckY(d,station)-0.025,stationZ(d,station,1));
  }
  const lowerAngle=angle-Math.PI;
  const cosine=Math.cos(lowerAngle);
  const side=cosine>=0?-1:1;
  return hullSurfacePoint(d,station,side,Math.abs(cosine));
}
