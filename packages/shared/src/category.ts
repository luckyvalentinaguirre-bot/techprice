/**
 * Canonical catalog of individual/component product categories that TechPrice
 * Uruguay compares. Pre-built / pre-configured computers (desktops sold
 * already assembled, "PC gamer armada", bundles/combos) are intentionally
 * NOT a category here — they must never be ingested as comparable products.
 * See packages/ingestion/src/filters/excludePrebuilt.ts for the enforcement.
 */
export const CATEGORIES = [
  "gpu",
  "cpu",
  "ram",
  "ssd",
  "hdd",
  "motherboard",
  "power_supply",
  "case",
  "cooling_air",
  "cooling_liquid",
  "monitor",
  "keyboard",
  "mouse",
  "headset",
  "speakers",
  "webcam",
  "microphone",
  "router",
  "wifi_card",
  "adapter",
  "flash_drive",
  "memory_card",
  "cable",
  "accessory",
  "notebook",
  "tablet",
  "smartphone",
  "console",
  "gamepad",
  "printer",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS_ES: Record<Category, string> = {
  gpu: "Tarjetas graficas (GPU)",
  cpu: "Procesadores (CPU)",
  ram: "Memorias RAM",
  ssd: "SSD",
  hdd: "HDD",
  motherboard: "Motherboards",
  power_supply: "Fuentes de alimentacion",
  case: "Gabinetes",
  cooling_air: "Refrigeracion por aire",
  cooling_liquid: "Refrigeracion liquida",
  monitor: "Monitores",
  keyboard: "Teclados",
  mouse: "Mouse",
  headset: "Auriculares",
  speakers: "Parlantes",
  webcam: "Webcams",
  microphone: "Microfonos",
  router: "Routers",
  wifi_card: "Placas WiFi",
  adapter: "Adaptadores",
  flash_drive: "Pendrives",
  memory_card: "Tarjetas de memoria",
  cable: "Cables",
  accessory: "Accesorios",
  notebook: "Notebooks",
  tablet: "Tablets",
  smartphone: "Celulares",
  console: "Consolas",
  gamepad: "Controles",
  printer: "Impresoras",
  other: "Otros productos",
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
