import { useState } from "react";

import { createDeck, shuffleDeck, drawCards } from "../services/DeckService";

import type { GameState } from "../types/GameState";

export function useGame() {
  const playerDeck = shuffleDeck(createDeck());
  const playerDraw = drawCards(playerDeck, 4);

  const enemyDeck = shuffleDeck(createDeck());
  const enemyDraw = drawCards(enemyDeck, 4);

  const [game] = useState<GameState>({
    turno: 1,

    player: {
      vida: 20,
      mazo: playerDraw.deck,
      mano: playerDraw.hand,
      campo: [],
      descarte: [],
    },

    enemy: {
      vida: 20,
      mazo: enemyDraw.deck,
      mano: enemyDraw.hand,
      campo: [],
      descarte: [],
    },
  });

  return game;
}