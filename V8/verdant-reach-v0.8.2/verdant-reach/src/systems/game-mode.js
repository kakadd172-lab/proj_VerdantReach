/** Resolve the mode stored on a world, defaulting legacy saves to Survival. */
export function resolveGameMode(savedWorld, requestedMode = 'survival') {
  if (savedWorld) return savedWorld.gameMode === 'creative' ? 'creative' : 'survival';
  return requestedMode === 'creative' ? 'creative' : 'survival';
}
