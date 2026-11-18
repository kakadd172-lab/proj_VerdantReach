import { WARGALION_V2_CASTLE_TIERS } from '../../architecture/blueprint-data.js';
import { buildAftercastleSideWall } from './aftercastle-side-walls-generator.js';
import { buildAftercastleEndWall } from './aftercastle-end-walls-generator.js';
import { buildAftercastleRoof } from './aftercastle-roof-generator.js';
import { buildAftercastleWindows } from './aftercastle-windows-generator.js';
import { buildQuarterGallery } from './quarter-gallery-generator.js';
import { buildSternGallery } from './stern-gallery-generator.js';

/** Assembly-only coordinator. Dedicated files own each castle component. */
export function buildAftercastle(d,ctx){
  const {part}=ctx,castle=part('aftercastle');
  for(const tier of WARGALION_V2_CASTLE_TIERS){
    const group=part('aftercastle-tier-'+tier.id,castle);
    const port=part('aftercastle-side-port-tier-'+tier.id,group);
    const starboard=part('aftercastle-side-starboard-tier-'+tier.id,group);
    const forward=part('aftercastle-front-wall-tier-'+tier.id,group);
    const aft=part('aftercastle-aft-wall-tier-'+tier.id,group);
    const deck=part('aftercastle-roof-tier-'+tier.id,group);
    const gallery=part('stern-gallery-tier-'+tier.id,castle);
    buildAftercastleSideWall(d,ctx,port,-1,tier);
    buildAftercastleSideWall(d,ctx,starboard,1,tier);
    buildAftercastleEndWall(d,ctx,forward,tier,tier.t0,-1);
    buildAftercastleEndWall(d,ctx,aft,tier,tier.t1,1);
    buildAftercastleRoof(d,ctx,deck,tier);
    buildSternGallery(d,ctx,gallery,tier);
    group.userData.cabinTier=Object.freeze({...tier});
  }
  const windows=part('aftercastle-windows',castle);
  buildAftercastleWindows(d,ctx,windows,WARGALION_V2_CASTLE_TIERS);
  const lower=WARGALION_V2_CASTLE_TIERS[0];
  buildQuarterGallery(d,ctx,part('quarter-gallery-port',castle),-1,lower);
  buildQuarterGallery(d,ctx,part('quarter-gallery-starboard',castle),1,lower);
  castle.userData.tierCount=WARGALION_V2_CASTLE_TIERS.length;
  castle.userData.form='three narrowing deck levels, timber-framed walls, tiered windows and projecting stern galleries';
  castle.userData.geometryCoordinator='assembly only; separate component generators own all meshes';
}
