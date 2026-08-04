import type { CardModel } from "./Card";

export interface Player {
  vida: number;
  mazo: CardModel[];
  mano: CardModel[];
  campo: CardModel[];
  descarte: CardModel[];
}