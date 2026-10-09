import { describe, expect, it } from "vitest";
import { resolveShipArtwork } from "@/lib/shipArtwork";

describe("published starter boat artwork", () => {
  it("uses the studio small boat idle image for catalog ship 1", () => {
    expect(resolveShipArtwork({ "ship-1:idle": "custom-boat.png" }, 1, "idle", "original.png")).toBe("custom-boat.png");
  });
  it("uses the exact fishing pose ahead of idle", () => {
    expect(resolveShipArtwork({ "ship-1:idle": "idle.png", "ship-1:submerged": "fishing.png" }, 1, "submerged", "original.png")).toBe("fishing.png");
  });
  it("falls back to published idle when a pose is absent", () => {
    expect(resolveShipArtwork({ "ship-1:idle": "idle.png" }, 1, "haul", "original.png")).toBe("idle.png");
  });
  it("preserves original artwork when nothing is published", () => {
    expect(resolveShipArtwork({}, 1, "cast", "original.png")).toBe("original.png");
  });
});