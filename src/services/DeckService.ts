import { cards } from "../data/cards";
import type { CardModel } from "../types/Card";

export function createDeck(): CardModel[] {
  return [...cards];
}

export function shuffleDeck(deck: CardModel[]): CardModel[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function drawCards(
  deck: CardModel[],
  amount: number
): {
  hand: CardModel[];
  deck: CardModel[];
} {
  return {
    hand: deck.slice(0, amount),
    deck: deck.slice(amount),
  };
}