import { describe, expect, it } from "vitest";
import { canRecall, catchQuantity, fishingProgress } from "@/lib/fishingTrip";
import { fleetCatalog } from "@/lib/fleetCatalog";

describe("captain-controlled fishing", () => {
  it("allows recall before the trip is complete, including departure", () => {
    expect(canRecall("sailingOut")).toBe(true);
    expect(canRecall("fishing")).toBe(true);
    expect(canRecall("full")).toBe(true);
    expect(canRecall("sailingHome")).toBe(false);
  });
  it("caps a 30-second boat catch and never grows offshore afterward", () => {
    expect(catchQuantity(120, 15000, 30)).toBe(60);
    expect(catchQuantity(120, 30000, 30)).toBe(120);
    expect(catchQuantity(120, 300000, 30)).toBe(120);
    expect(fishingProgress(0, 30)).toBe(0);
  });
  it("preserves all sixteen supplied fishing durations without crew", () => {
    expect(fleetCatalog.filter(s => s.source === "store").map(s => s.tripSeconds)).toEqual([30, 50, 90, 120, 180, 240, 360, 600, 900, 1080, 1320, 1500, 1800, 2100, 2400, 3000]);
  });
});