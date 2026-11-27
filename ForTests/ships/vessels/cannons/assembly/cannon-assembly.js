import { buildBarrelBody } from '../barrel/body/barrel-body-generator.js';
import { buildMuzzle } from '../barrel/muzzle/muzzle-generator.js';
import { buildReinforcementRings } from '../barrel/reinforcement-rings/reinforcement-rings-generator.js';
import { buildTrunnions } from '../barrel/trunnions/trunnions-generator.js';
import { buildCascabel } from '../barrel/cascabel/cascabel-generator.js';
import { buildCarriageCheeks } from '../carriage/cheeks/carriage-cheeks-generator.js';
import { buildCarriageBed } from '../carriage/bed/carriage-bed-generator.js';
import { buildCarriageTransoms } from '../carriage/transoms/carriage-transoms-generator.js';
import { buildCarriageAxles } from '../carriage/axles/carriage-axles-generator.js';
import { buildCarriageWheels } from '../carriage/wheels/carriage-wheels-generator.js';
import { buildCarriageHardware } from '../carriage/hardware/carriage-hardware-generator.js';

export const CANNON_ASSEMBLY_ORDER = Object.freeze([
 'barrel-body','muzzle-face','reinforcement-rings','trunnions','cascabel',
 'carriage-cheeks','carriage-bed','carriage-transoms','carriage-axles',
 'carriage-wheels','carriage-hardware'
]);

export function assembleCannon(ctx, dimensions) {
 buildBarrelBody(ctx,dimensions);
 buildMuzzle(ctx,dimensions);
 buildReinforcementRings(ctx,dimensions);
 buildTrunnions(ctx,dimensions);
 buildCascabel(ctx,dimensions);
 buildCarriageCheeks(ctx,dimensions);
 buildCarriageBed(ctx,dimensions);
 buildCarriageTransoms(ctx,dimensions);
 buildCarriageAxles(ctx,dimensions);
 buildCarriageWheels(ctx,dimensions);
 buildCarriageHardware(ctx,dimensions);
 return ctx.root;
}
