import { fleetCatalog, starterShip, type FleetShip } from "@/lib/fleetCatalog";
import { loadLedger, saveLedger, type Ledger } from "@/lib/market";

/** Local harbor state: owned ships and fish in the hold. Stored in the shared ledger. */
const OWNED_KEY = "bay:owned-ships";
export const HARBOR_UPDATED = "island-bay:harbor-updated";

const IMG = {
  sardine: "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/25365535-261c-4a49-a6e3-842b94b8a2d8/fish-sardine.png",
  mackerel: "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/ffebb842-1d7a-4cd2-9fae-d66883e496e6/fish-mackerel.png",
  tuna: "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/d40f7c1c-8c7f-47ec-89a0-120eaa992bde/fish-tuna.png",
  sword: "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/c3244a96-c3a8-495b-ac9e-2ece36ee74e6/fish-swordfish.png",
  turtle: "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/67e96dc8-9734-4101-8659-09807e61e0af/fish-turtle.png",
  pearl: "https://project--356242e8-144f-42b3-8292-474399c324ac.lovable.app/__l5e/assets-v1/4b0616ca-5528-47ea-8c87-3ea157b6de3e/fish-pearl.png",
};

export type Fish = { id: string; name: string; img: string; base: number };

/** Every species any ship can catch, priced by the rarest ship that pulls it up. */
export const FISH: Fish[] = (() => {
  const seen = new Map<string, Fish>();
  fleetCatalog.forEach((ship, index) => {
    for (const name of ship.fish) {
      if (seen.has(name)) continue;
      const img = name.includes("سردين") || name.includes("مكاريل") ? IMG.sardine
        : name.includes("حوت") || name.includes("مانتا") ? IMG.sword
        : name.includes("محار") ? IMG.pearl
        : name.includes("سلطعون") || name.includes("سرطان") || name.includes("جراد") ? IMG.turtle
        : name.includes("تونة") || name.includes("سلمون") ? IMG.tuna
        : IMG.mackerel;
      seen.set(name, { id: `fish:${name}`, name, img, base: Number((1 + index * 1.6).toFixed(1)) });
    }
  });
  return [...seen.values()];
})();

export const fishById = (id: string) => FISH.find((f) => f.id === id);

export function ownedShips(): number[] {
  if (typeof window === "undefined") return [starterShip.id];
  try {
    const ids = JSON.parse(window.localStorage.getItem(OWNED_KEY) ?? "null") as number[] | null;
    return ids?.length ? ids : [starterShip.id];
  } catch {
    return [starterShip.id];
  }
}

function notify() {
  window.dispatchEvent(new Event(HARBOR_UPDATED));
}

export function buyShip(ship: FleetShip): string | null {
  if (ship.currency !== "coin") return "هذه السفينة تُشترى بالجواهر — غير متاح حالياً";
  const owned = ownedShips();
  if (owned.includes(ship.id)) return "تملك هذه السفينة بالفعل";
  const ledger = loadLedger();
  if (ledger.coins < ship.price) return "لا تكفي العملات لشراء السفينة";
  saveLedger({ ...ledger, coins: ledger.coins - ship.price });
  window.localStorage.setItem(OWNED_KEY, JSON.stringify([...owned, ship.id]));
  notify();
  return null;
}

export type CatchLine = { fish: Fish; qty: number };

/** Roll a catch sized by the trip length of the catalog ship, and put it in the hold. */
export function landCatch(catalogId: number): CatchLine[] {
  const ship = fleetCatalog.find((s) => s.id === catalogId) ?? starterShip;
  const lines: CatchLine[] = ship.fish
    .map((name) => FISH.find((f) => f.name === name)!)
    .filter(Boolean)
    .map((fish) => ({ fish, qty: Math.max(1, Math.round(ship.tripSeconds * (1.5 + Math.random() * 2.5))) }));
  const ledger = loadLedger();
  const holdings = { ...ledger.holdings };
  for (const l of lines) holdings[l.fish.id] = (holdings[l.fish.id] ?? 0) + l.qty;
  saveLedger({ ...ledger, holdings });
  notify();
  return lines;
}

export const HOURS = ["4 pm", "5 pm", "6 pm", "7 pm", "8 pm", "9 pm", "10 pm", "11 pm", "12 am", "1 am", "2 am", "3 am"];

/** Hourly price line, stable within the hour. The last point is the live price. */
export function priceSeries(fish: Fish): number[] {
  const hour = Math.floor(Date.now() / 3_600_000);
  const seed = [...fish.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return HOURS.map((_, i) => {
    const n = Math.sin((seed + hour - 11 + i) * 12.9898) * 43758.5453;
    const r = n - Math.floor(n);
    return Number((fish.base * (0.7 + r * 0.9)).toFixed(2));
  });
}

export function sellFish(fish: Fish, qty: number, price: number): Ledger | string {
  const ledger = loadLedger();
  const have = ledger.holdings[fish.id] ?? 0;
  if (qty < 1 || qty > have) return "لا تملك كمية كافية";
  const next: Ledger = {
    ...ledger,
    coins: ledger.coins + Math.round(qty * price),
    holdings: { ...ledger.holdings, [fish.id]: have - qty },
  };
  saveLedger(next);
  notify();
  return next;
}
