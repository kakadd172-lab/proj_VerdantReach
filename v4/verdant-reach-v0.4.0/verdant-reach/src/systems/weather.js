import { hash2, random2, clamp } from '../core/random.js';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const WEATHER = ['clear', 'overcast', 'rain', 'storm', 'snow', 'fog'];

export class WeatherSystem {
  constructor(seed) {
    this.seed = seed >>> 0;
  }

  at(x, z, worldSeconds, climate) {
    const worldHour = worldSeconds / 20 + 8;
    const day = Math.floor(worldHour / 24) + 1;
    const hour = ((worldHour % 24) + 24) % 24;
    const seasonIndex = Math.floor((day - 1) / 28) % 4;
    const season = SEASONS[seasonIndex];
    const cellX = Math.floor(x / 1800);
    const cellZ = Math.floor(z / 1800);
    const period = Math.floor(worldHour / 5);
    const roll = random2(cellX + period * 13, cellZ - day * 7, this.seed ^ 0x71d3);
    const variation = random2(cellX - 31, cellZ + period, this.seed ^ day) * 0.18;
    const seasonTemp = season === 'summer' ? 0.1 : season === 'winter' ? -0.18 : season === 'autumn' ? -0.04 : 0.02;
    const temperature = clamp((climate?.temperature ?? 0.5) + seasonTemp + variation * 0.25, 0, 1);
    const rainfall = clamp((climate?.rainfall ?? 0.4) + variation * 0.45, 0, 1);
    const precipitationChance = clamp(0.08 + rainfall * 0.57, 0.08, 0.72);
    let type = 'clear';
    if (roll < precipitationChance) {
      if (temperature < 0.29) type = 'snow';
      else if (roll < precipitationChance * 0.22 && rainfall > 0.65) type = 'storm';
      else type = 'rain';
    } else if (roll < precipitationChance + 0.12 && (climate?.moisture ?? 0) > 0.61) {
      type = 'fog';
    } else if (roll > 0.86) {
      type = 'overcast';
    }
    const windAngle = random2(cellX + day, cellZ - period, this.seed ^ 0x2f61) * Math.PI * 2;
    const windStrength = type === 'storm' ? 0.82 + variation : type === 'clear' ? 0.12 + variation : 0.28 + variation * 2.2;
    const intensity = type === 'clear' ? 0 : clamp(0.25 + roll * 0.72, 0.12, 1);
    return {
      type,
      label: WEATHER.includes(type) ? type.toUpperCase() : 'CLEAR',
      day,
      hour,
      season,
      temperature,
      rainfall,
      intensity,
      windAngle,
      windStrength: clamp(windStrength, 0.08, 1),
      visibility: type === 'fog' ? 0.42 : type === 'storm' ? 0.66 : type === 'rain' || type === 'snow' ? 0.82 : 1,
    };
  }
}

export const WORLD_SEASONS = SEASONS;
