export interface DeckListEntry {
  defId: string;
  cantidad: number;
}

/** Composición del mazo de demo, según el PDF de reglas. Ambos jugadores usan el mismo mazo por ahora. */
export const demoDeckList: DeckListEntry[] = [
  { defId: "tortuga", cantidad: 4 },
  { defId: "aguila", cantidad: 4 },
  { defId: "cactus", cantidad: 4 },
  { defId: "topo", cantidad: 4 },
  { defId: "colibri", cantidad: 4 },
  { defId: "leon", cantidad: 4 },
  { defId: "conejo_fuego", cantidad: 2 },
  { defId: "vitaminas", cantidad: 2 },
  { defId: "bomba_humo", cantidad: 2 },
  { defId: "disparo_certero", cantidad: 2 },
  { defId: "soga", cantidad: 2 },
];
