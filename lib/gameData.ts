// Datos estaticos del juego compartidos entre cliente y servidor.

export const MAP_W = 2400;
export const MAP_H = 1600;

export type WorldObject = {
  id: string;
  emoji: string;
  label: string;
  x: number;
  y: number;
  size: number;
};

// Objetos del mapa exterior — agrupados cerca del centro
export const WORLD_OBJECTS: WorldObject[] = [
  { id: 'house',       emoji: '🏠', label: 'Casa',     x: 1200, y: 500,  size: 110 },
  { id: 'mailbox_ext', emoji: '📮', label: 'Buzon',    x: 1340, y: 590,  size: 50  },
  { id: 'well',        emoji: '⛲', label: 'Pozo',     x: 960,  y: 680,  size: 80  },
  { id: 'cropzone',    emoji: '🌾', label: 'Huerto',   x: 780,  y: 820,  size: 80  },
  { id: 'cow',         emoji: '🐄', label: 'Vaca',     x: 1480, y: 730,  size: 70  },
  { id: 'chicken',     emoji: '🐔', label: 'Gallina',  x: 1380, y: 860,  size: 55  },
  { id: 'sheep',       emoji: '🐑', label: 'Oveja',    x: 1560, y: 880,  size: 65  },
  { id: 'mill',        emoji: '🏭', label: 'Molino',   x: 1650, y: 550,  size: 100 },
  { id: 'tree',        emoji: '🌳', label: 'Arbol',    x: 900,  y: 420,  size: 90  },
  { id: 'tree2',       emoji: '🌳', label: 'Arbol',    x: 1050, y: 980,  size: 90  },
  { id: 'tree3',       emoji: '🌲', label: 'Pino',     x: 1500, y: 1000, size: 90  },
  { id: 'sunflower',   emoji: '🌻', label: 'Girasol',  x: 860,  y: 600,  size: 55  },
  { id: 'sunflower2',  emoji: '🌻', label: 'Girasol',  x: 910,  y: 570,  size: 50  },
  { id: 'pond',        emoji: '🪷', label: 'Estanque', x: 1380, y: 420,  size: 70  },
  { id: 'rock',        emoji: '🪨', label: 'Roca',     x: 700,  y: 1050, size: 60  },
];

export type InteriorObject = {
  id: string;
  emoji: string;
  label: string;
  canBeTrigger: boolean;
};

export const INTERIOR_OBJECTS: InteriorObject[] = [
  { id: 'bed',      emoji: '🛏️', label: 'Cama',     canBeTrigger: false },
  { id: 'kitchen',  emoji: '🍳', label: 'Cocina',   canBeTrigger: false },
  { id: 'radio',    emoji: '📻', label: 'Radio',    canBeTrigger: true  },
  { id: 'mirror',   emoji: '🪞', label: 'Espejo',   canBeTrigger: true  },
  { id: 'phone',    emoji: '☎️', label: 'Telefono', canBeTrigger: true  },
  { id: 'candle',   emoji: '🕯️', label: 'Vela',     canBeTrigger: true  },
  { id: 'mailbox',  emoji: '📬', label: 'Buzon',    canBeTrigger: true  },
  { id: 'painting', emoji: '🖼️', label: 'Cuadro',   canBeTrigger: true  },
  { id: 'plant',    emoji: '🪴', label: 'Planta',   canBeTrigger: true  },
  { id: 'clock',    emoji: '🕰️', label: 'Reloj',    canBeTrigger: true  },
];

export const EXTERIOR_TRIGGER_IDS = ['mailbox_ext', 'sunflower', 'rock', 'pond', 'well'];

export const CROP_TYPES: Record<string, { emoji: string; hours: number; seedCost: number; sellPrice: number; xp: number; label: string }> = {
  carrot:     { emoji: '🥕', hours: 2, seedCost: 5,  sellPrice: 12, xp: 5,  label: 'Zanahoria' },
  wheat:      { emoji: '🌾', hours: 4, seedCost: 8,  sellPrice: 20, xp: 8,  label: 'Trigo'     },
  corn:       { emoji: '🌽', hours: 6, seedCost: 12, sellPrice: 32, xp: 12, label: 'Maiz'      },
  strawberry: { emoji: '🍓', hours: 8, seedCost: 18, sellPrice: 48, xp: 18, label: 'Fresa'     },
};

export const ANIMAL_TYPES: Record<string, { emoji: string; produce: string; produceLabel: string; sellPrice: number; feedCost: number; xp: number; label: string }> = {
  cow:     { emoji: '🐄', produce: '🥛', produceLabel: 'Leche', sellPrice: 25, feedCost: 8, xp: 10, label: 'Vaca'    },
  chicken: { emoji: '🐔', produce: '🥚', produceLabel: 'Huevo', sellPrice: 10, feedCost: 4, xp: 5,  label: 'Gallina' },
  sheep:   { emoji: '🐑', produce: '🧶', produceLabel: 'Lana',  sellPrice: 30, feedCost: 8, xp: 12, label: 'Oveja'   },
};

export function xpForLevel(level: number): number {
  return level * 100;
}
