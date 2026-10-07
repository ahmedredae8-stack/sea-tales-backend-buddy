import armorAtlas from "@/assets/armor-atlas.png.asset.json";
import captainsAtlas from "@/assets/captains-atlas.png.asset.json";
import crewAtlas from "@/assets/crew-atlas.png.asset.json";
import gemsAtlas from "@/assets/gems-atlas.png.asset.json";
import weaponsAtlas from "@/assets/weapons-atlas.png.asset.json";

type Atlas = "weapon" | "crew" | "captain" | "armor" | "gem";

const atlasData: Record<Atlas, { src: string; columns: number; rows: number }> = {
  weapon: { src: weaponsAtlas.url, columns: 3, rows: 2 },
  crew: { src: crewAtlas.url, columns: 3, rows: 3 },
  captain: { src: captainsAtlas.url, columns: 3, rows: 2 },
  armor: { src: armorAtlas.url, columns: 3, rows: 2 },
  gem: { src: gemsAtlas.url, columns: 2, rows: 2 },
};

export function GameSprite({ atlas, index, className = "" }: { atlas: Atlas; index: number; className?: string }) {
  const data = atlasData[atlas];
  const x = index % data.columns;
  const y = Math.floor(index / data.columns);
  return (
    <span
      aria-hidden="true"
      className={`game-sprite ${className}`}
      style={{
        backgroundImage: `url(${data.src})`,
        backgroundSize: `${data.columns * 100}% ${data.rows * 100}%`,
        backgroundPosition: `${data.columns === 1 ? 0 : (x / (data.columns - 1)) * 100}% ${data.rows === 1 ? 0 : (y / (data.rows - 1)) * 100}%`,
      }}
    />
  );
}

export function CaptainAvatar({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  return <GameSprite atlas="captain" index={Math.abs(seed) % 6} className={`captain-sprite ${className}`} />;
}

export function nameSeed(name: string) {
  return [...name].reduce((sum, letter) => sum + (letter.codePointAt(0) ?? 0), 0);
}
