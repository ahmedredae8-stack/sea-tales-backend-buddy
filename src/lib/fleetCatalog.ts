import hull1 from "@/assets/fleet/hull-1.png";
import hull2 from "@/assets/fleet/hull-2.png";
import hull3 from "@/assets/fleet/hull-3.png";
import hull4 from "@/assets/fleet/hull-4.png";
import hull5 from "@/assets/fleet/hull-5.png";
import hull6 from "@/assets/fleet/hull-6.png";

/** The six drawn hulls. Every hull is trimmed to the same canvas and waterline,
 *  so poses never shift: the nets, ropes and spray are drawn over the hull. */
export const hulls = [hull1, hull2, hull3, hull4, hull5, hull6] as const;

export type ShipPose = "idle" | "cast" | "submerged" | "haul";

export type FleetShip = {
  id: number;
  name: string;
  /** Species this hull pulls up. */
  fish: string[];
  /** Full trip length in seconds, with no crew aboard. */
  tripSeconds: number;
  source: "store" | "tribe";
  /** Drawn hull art shared by all four poses. */
  hull: string;
  price: number;
  currency: "coin" | "gem";
};

type Row = [name: string, fish: string[], seconds: number, hull: number, price: number, currency: "coin" | "gem"];

const storeRows: Row[] = [
  ["قارب صغير", ["سردين"], 30, 0, 450, "coin"],
  ["لنش", ["سردين"], 50, 1, 1200, "coin"],
  ["مركب", ["سردين", "قد"], 90, 0, 3200, "coin"],
  ["مركب سريع", ["حفش", "محار"], 120, 1, 7500, "coin"],
  ["مركب شراعي", ["محار", "سلور"], 180, 2, 14000, "coin"],
  ["سفينة شراعية", ["قد", "دنيس"], 240, 3, 26000, "coin"],
  ["سفينة صيد", ["مفلطح", "سلمون"], 360, 4, 48000, "coin"],
  ["سفينة صيد كبيرة", ["سلمون", "كريل"], 600, 4, 90000, "coin"],
  ["مركب كمين", ["سرطان البحر", "قد"], 900, 2, 160000, "coin"],
  ["يخت", ["سلمون", "سلطعون"], 1080, 5, 280000, "coin"],
  ["مركب متقدم", ["سمك نهري", "مفلطح"], 1320, 3, 480000, "coin"],
  ["مركب ثلجي", ["حبار", "ثعبان البحر"], 1500, 4, 750000, "coin"],
  ["حفارة", ["مانتا راي", "حبار"], 1800, 4, 120, "gem"],
  ["معرض البحرية", ["سلور", "مانتا راي"], 2100, 5, 220, "gem"],
  ["مركز أبحاث السفن", ["جراد البحر", "سمكة الأفعى"], 2400, 5, 420, "gem"],
  ["غواصة", ["الحوت الصيني", "الحوت القاتل"], 3000, 5, 950, "gem"],
];

const tribeRows: Row[] = [
  ["ريح", ["سردين", "شمس المحيط"], 30, 0, 60, "gem"],
  ["نار", ["سردين", "التونة الوثابة"], 30, 1, 60, "gem"],
  ["برق", ["سردين", "مكاريل"], 30, 2, 60, "gem"],
];

const build = (rows: Row[], source: "store" | "tribe", offset: number): FleetShip[] =>
  rows.map(([name, fish, tripSeconds, hull, price, currency], index) => ({
    id: offset + index + 1,
    name,
    fish,
    tripSeconds,
    source,
    hull: hulls[hull]!,
    price,
    currency,
  }));

export const fleetCatalog: FleetShip[] = [
  ...build(storeRows, "store", 0),
  ...build(tribeRows, "tribe", storeRows.length),
];

export const starterShip = fleetCatalog[0]!;

/** "1د 30ث" style trip label. */
export function tripLabel(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return `${s}ث`;
  return s ? `${m}د ${s}ث` : `${m}د`;
}
