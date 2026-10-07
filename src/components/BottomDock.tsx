import { Button } from "@/components/ui/button";
import dockChat from "@/assets/dock/chat.png.asset.json";
import dockStats from "@/assets/dock/stats.png.asset.json";
import dockBag from "@/assets/dock/bag.png.asset.json";
import dockStore from "@/assets/dock/store.png.asset.json";
import dockQuests from "@/assets/dock/quests.png.asset.json";
import dockBattle from "@/assets/dock/battle.png.asset.json";
import dockTribe from "@/assets/dock/tribe.png.asset.json";
import { playSfx } from "@/lib/sound";

export type DockAction = "chat" | "stats" | "bag" | "store" | "quests" | "battle" | "tribe";

const items: { id: DockAction; label: string; image: string }[] = [
  { id: "chat", label: "الدردشة", image: dockChat.url },
  { id: "stats", label: "الترتيب", image: dockStats.url },
  { id: "bag", label: "مخزن العتاد", image: dockBag.url },
  { id: "store", label: "المتجر", image: dockStore.url },
  { id: "quests", label: "التنبيهات", image: dockQuests.url },
  { id: "battle", label: "الأعداء", image: dockBattle.url },
  { id: "tribe", label: "القبيلة", image: dockTribe.url },
];

export function BottomDock({ onAction }: { onAction: (action: DockAction) => void }) {
  return (
    <nav className="game-dock" aria-label="قائمة اللعبة">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Button
              variant="ghost"
              className="game-dock-button"
              aria-label={item.label}
              title={item.label}
              onPointerEnter={() => playSfx("hover", 0.3)}
              onClick={() => {
                playSfx("click", 0.72);
                onAction(item.id);
              }}
            >
              <img src={item.image} alt="" width={256} height={264} draggable={false} />
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
