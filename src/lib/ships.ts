export type Rarity = "common" | "rare" | "epic" | "legendary";

export type Ship = {
  id: string;
  name: string;
  img: string;
  price: number;
  currency: "coin" | "gem";
  rarity: Rarity;
  level: number;
  /** 1..10 */
  speed: number;
  cargo: number;
  crew: number;
  desc: string;
};

export const rarityLabel: Record<Rarity, string> = {
  common: "عادية",
  rare: "نادرة",
  epic: "ملحمية",
  legendary: "أسطورية",
};

export const ships: Ship[] = [
  {
    id: "skiff",
    name: "قارب الصياد",
    img: "/__l5e/assets-v1/f34ddec0-d384-4997-a219-1a74d9c055c1/ship-1.png",
    price: 450,
    currency: "coin",
    rarity: "common",
    level: 1,
    speed: 2,
    cargo: 2,
    crew: 1,
    desc: "بداية كل قبطان — خفيف وسريع الإصلاح.",
  },
  {
    id: "trawler",
    name: "سفينة الجرّ الحمراء",
    img: "/__l5e/assets-v1/f60212f3-0bb3-49c0-ae04-7860ab9bed58/ship-2.png",
    price: 3500,
    currency: "coin",
    rarity: "common",
    level: 3,
    speed: 4,
    cargo: 4,
    crew: 3,
    desc: "شِباك أوسع وصيد مضاعف في المياه الضحلة.",
  },
  {
    id: "cruiser",
    name: "الطرّاد البحري",
    img: "/__l5e/assets-v1/af657176-bbb4-4691-a017-c7fb08718907/ship-3.png",
    price: 10000,
    currency: "coin",
    rarity: "rare",
    level: 6,
    speed: 6,
    cargo: 6,
    crew: 5,
    desc: "رادار يكشف أسراب السمك النادرة قبل غيرك.",
  },
  {
    id: "yacht",
    name: "اليخت الملكي",
    img: "/__l5e/assets-v1/76dfcca9-6816-4045-bbd5-65b6a37b7814/ship-4.png",
    price: 50000,
    currency: "coin",
    rarity: "epic",
    level: 10,
    speed: 8,
    cargo: 8,
    crew: 8,
    desc: "رفاهية وسرعة — يفتح موانئ المدن الكبرى.",
  },
  {
    id: "galleon",
    name: "غاليون القراصنة",
    img: "/__l5e/assets-v1/58e8c314-d7a0-42be-a4ee-5be92cb15110/ship-5.png",
    price: 120,
    currency: "gem",
    rarity: "epic",
    level: 14,
    speed: 7,
    cargo: 9,
    crew: 12,
    desc: "مدافع جانبية ومخزن ضخم لغنائم المعارك.",
  },
  {
    id: "flagship",
    name: "سفينة العرش الذهبية",
    img: "/__l5e/assets-v1/4e21753a-1ed8-42ed-a00e-c22e258d43ca/ship-6.png",
    price: 950,
    currency: "gem",
    rarity: "legendary",
    level: 20,
    speed: 10,
    cargo: 10,
    crew: 20,
    desc: "أسطورة الخليج — لا تُقهر في المياه المفتوحة.",
  },
];

export function fmt(n: number) {
  return n.toLocaleString("en-US");
}

/* ── Fleet rack & upgradeable flagship ─────────────────────
 * One painted strip holds the whole dock line-up, and the flagship
 * carries three upgrade tiers behind their own tabs. */

export const SHIP_STRIP = "/__l5e/assets-v1/956b5518-6f15-4d72-bbc5-e1de01e77fda/ship-strip.png";

export type ShipTier = {
  star: 1 | 2 | 3;
  label: string;
  img: string;
  /** Same duties as any ship: hull, armour, hold, repair and fishing runs. */
  hp: number;
  armor: number;
  speed: number;
  storage: number;
  repairMin: number;
  fishingMin: number;
  cost: number;
  currency: "coin" | "gem";
  success: number;
};

export const FLAGSHIP = {
  id: "royal-galleon",
  name: "الغاليون الملكي",
  hero: "/__l5e/assets-v1/bfad0654-27c5-40f3-833d-13ad7d89c243/ship-hero.png",
  desc: "سفينة القيادة — ترقّها نجمة بعد نجمة فتزيد حمولتها وسرعة صيدها.",
  tiers: [
    {
      star: 1,
      label: "نجمة",
      img: "/__l5e/assets-v1/082aa67f-b846-4413-961b-53e6f5a85359/hero-t1.png",
      hp: 2400,
      armor: 120,
      speed: 5,
      storage: 350000,
      repairMin: 25,
      fishingMin: 40,
      cost: 250000,
      currency: "coin",
      success: 60,
    },
    {
      star: 2,
      label: "نجمتان",
      img: "/__l5e/assets-v1/cb2fad6b-9418-400a-abfe-ca9d02e57644/hero-t2.png",
      hp: 4800,
      armor: 260,
      speed: 7,
      storage: 700000,
      repairMin: 18,
      fishingMin: 30,
      cost: 900000,
      currency: "coin",
      success: 45,
    },
    {
      star: 3,
      label: "ثلاث نجوم",
      img: "/__l5e/assets-v1/12b7cc54-e923-4f9e-aec9-7ecf9e085f95/hero-t3.png",
      hp: 9600,
      armor: 520,
      speed: 10,
      storage: 1500000,
      repairMin: 10,
      fishingMin: 18,
      cost: 320,
      currency: "gem",
      success: 30,
    },
  ] as ShipTier[],
};

export function tierOf(star: number): ShipTier {
  return FLAGSHIP.tiers[Math.max(0, Math.min(2, star - 1))]!;
}
