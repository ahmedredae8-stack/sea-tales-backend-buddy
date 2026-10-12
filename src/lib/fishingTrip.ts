/** A trip fills once and cannot grow after its catalog duration. */
export function fishingProgress(elapsedMs: number, tripSeconds: number): number {
  if (tripSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, elapsedMs / (tripSeconds * 1000)));
}

export function catchQuantity(capacity: number, elapsedMs: number, tripSeconds: number): number {
  return Math.floor(capacity * fishingProgress(elapsedMs, tripSeconds));
}

export function canRecall(state: string): boolean {
  return ["sailingOut", "turning", "casting", "fishing", "full"].includes(state);
}