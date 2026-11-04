/**
 * Freeze independent vessel specifications so runtime edits cannot mutate
 * the source catalogue. Nested design arrays and objects are also frozen.
 */
export function freezeVesselSpec(value) {
  const seen = new WeakSet();
  const freeze = (item) => {
    if (!item || typeof item !== 'object' || seen.has(item)) return item;
    seen.add(item);
    Object.values(item).forEach(freeze);
    return Object.freeze(item);
  };
  return freeze(value);
}
