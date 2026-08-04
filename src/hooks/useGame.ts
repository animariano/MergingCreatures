import { useState } from "react";

import { createDeck } from "../services/DeckService";

import type { GameState } from "../types/GameState";

export function useGame() {
  const [game] = useState<GameState>({
    turno: 1,

    player: {
      vida: 20,
      mazo: createDeck(),
      mano: createDeck(),
      campo: [],
      descarte: [],
    },

    enemy: {
      vida: 20,
      mazo: createDeck(),
      mano: [],
      campo: [],
      descarte: [],
    },
  });

  return game;
}