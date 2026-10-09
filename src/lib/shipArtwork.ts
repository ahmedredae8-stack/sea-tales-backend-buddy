import type { ShipPose } from "@/lib/fleetCatalog";

/** Prefer a full custom pose, then custom idle hull, then the original hull. */
export function resolveShipArtwork(artwork: Record<string, string>, catalogId: number, pose: ShipPose, fallback: string): string {
  return artwork[`ship-${catalogId}:${pose}`] || artwork[`ship-${catalogId}:idle`] || fallback;
}