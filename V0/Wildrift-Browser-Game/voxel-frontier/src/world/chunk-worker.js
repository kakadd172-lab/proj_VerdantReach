import { WorldGenerator } from './generator.js';

let activeSeed = null;
let generator = null;

self.onmessage = (event) => {
  const { id, cx, cz, seed } = event.data;
  try {
    if (activeSeed !== seed) {
      activeSeed = seed;
      generator = new WorldGenerator(seed);
    }
    const { data } = generator.generateChunkData(cx, cz);
    self.postMessage({ id, cx, cz, data: data.buffer }, [data.buffer]);
  } catch (error) {
    self.postMessage({ id, cx, cz, error: String(error?.stack || error) });
  }
};
