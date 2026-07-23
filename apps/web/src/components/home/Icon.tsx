import type { Category } from "@techprice/shared";

/**
 * Single-source line-icon set. Every glyph shares the same 24×24 grid,
 * 1.75 stroke and round joins so the whole UI reads as one icon family.
 */
const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />,
  layers: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6M17 20a5.5 5.5 0 0 0-2.5-4.6" />
    </>
  ),
  store: <path d="M4 9h16l-1-4H5L4 9Zm0 0v10h16V9M9 19v-5h6v5" />,
  bell: <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21a2 2 0 0 0 4 0" />,
  chart: <path d="M4 4v16h16M8 15l3-4 3 2 4-6" />,
  trendingUp: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  trendingDown: <path d="M3 7l6 6 4-4 8 8M15 17h6v-6" />,
  flame: <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s0 2 2 2c1.5 0 2-1.5 1-4-.6-1.4 1-3 0-4Z" />,
  plus: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  refresh: <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />,
  github: (
    <path d="M9 19c-4 1.4-4-2.4-5.5-3M15 21v-3.2c0-.9.2-1.6-.5-2.2 2.3-.3 4.5-1.2 4.5-5a3.8 3.8 0 0 0-1-2.7 3.6 3.6 0 0 0-.1-2.7s-.9-.3-3 1a12 12 0 0 0-6 0C6 3.9 5 4.2 5 4.2a3.6 3.6 0 0 0-.1 2.7A3.8 3.8 0 0 0 4 9.6c0 3.7 2.2 4.7 4.5 5-.5.5-.5 1-.5 1.8V21" />
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17 7h.01" />
    </>
  ),
  // --- category glyphs ---
  gpu: <path d="M3 6h15a2 2 0 0 1 2 2v7H7a2 2 0 0 1-2-2V6ZM3 6v13M9 15v3M14 15v3M9 9.5h6M9 12h4" />,
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 10.5h4v4h-4zM9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
    </>
  ),
  memory: <path d="M4 8h16v8H4zM7 8V6M12 8V6M17 8V6M6 20v-4M10 20v-4M14 20v-4M18 20v-4" />,
  drive: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15h6" />
      <circle cx="16.5" cy="15" r="1" />
    </>
  ),
  board: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 4v4h4M16 20v-4M8 12h3v4M16 8h-3M14 12h2v2" />
      <circle cx="8" cy="16" r="1" />
    </>
  ),
  power: <path d="M12 3v8M8 6a7 7 0 1 0 8 0" />,
  case: <path d="M6 3h12v18H6zM9 6h6M9 9h6M10 20v-2h4v2" />,
  fan: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c-1-3 .5-6 1.5-6.5C15 4 14 8 12 10Zm2 2c3-1 6 .5 6.5 1.5.5 1.5-3.5.5-6.5-1.5Zm-2 2c1 3-.5 6-1.5 6.5-1.5.5-.5-3.5 1.5-6.5Zm-2-2c-3 1-6-.5-6.5-1.5C3 9.5 7 10.5 10 12Z" />
    </>
  ),
  monitor: <path d="M3 5h18v11H3zM8 20h8M12 16v4" />,
  keyboard: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="1.5" />
      <path d="M7 10h.01M11 10h.01M15 10h.01M8 13h8" />
    </>
  ),
  mouse: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="5" />
      <path d="M12 7v3" />
    </>
  ),
  headphones: <path d="M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z" />,
  speaker: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <circle cx="12" cy="14" r="3" />
      <path d="M12 7h.01" />
    </>
  ),
  camera: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 12h1M19 12h1" />
    </>
  ),
  mic: <path d="M12 3a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-5 0v-5A2.5 2.5 0 0 1 12 3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />,
  wifi: <path d="M4 8.5a13 13 0 0 1 16 0M6.5 12a9 9 0 0 1 11 0M9 15.5a5 5 0 0 1 6 0M12 19h.01" />,
  plug: <path d="M9 3v5M15 3v5M6 8h12v2a6 6 0 0 1-12 0V8ZM12 16v5" />,
  cable: (
    <>
      <path d="M4 8a4 4 0 0 1 8 0v8a4 4 0 0 0 8 0" />
      <path d="M2 8h4M18 16h4" />
    </>
  ),
  box: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5l8 4.5 8-4.5M12 12v9" />,
  laptop: <path d="M5 6h14v10H5zM3 19h18M9 19l.5-3h5l.5 3" />,
  tablet: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  gamepad: <path d="M8 9h8a5 5 0 0 1 5 5 3 3 0 0 1-5.4 1.8L14 14h-4l-1.6 1.8A3 3 0 0 1 3 14a5 5 0 0 1 5-5ZM7 12h2M8 11v2M15 11.5h.01M17 13.5h.01" />,
  printer: <path d="M7 8V3h10v5M7 8h10a3 3 0 0 1 3 3v5h-3M7 8a3 3 0 0 0-3 3v5h3m0 0v5h10v-7H7v2Z" />,
} as const;

export type IconName = keyof typeof PATHS;

const CATEGORY_ICONS: Record<Category, IconName> = {
  gpu: "gpu",
  cpu: "cpu",
  ram: "memory",
  ssd: "drive",
  hdd: "drive",
  motherboard: "board",
  power_supply: "power",
  case: "case",
  cooling_air: "fan",
  cooling_liquid: "fan",
  monitor: "monitor",
  keyboard: "keyboard",
  mouse: "mouse",
  headset: "headphones",
  speakers: "speaker",
  webcam: "camera",
  microphone: "mic",
  router: "wifi",
  wifi_card: "wifi",
  adapter: "plug",
  flash_drive: "drive",
  memory_card: "memory",
  cable: "cable",
  accessory: "box",
  notebook: "laptop",
  tablet: "tablet",
  smartphone: "phone",
  console: "gamepad",
  gamepad: "gamepad",
  printer: "printer",
  other: "box",
};

export function categoryIcon(category: Category): IconName {
  return CATEGORY_ICONS[category] ?? "box";
}

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
