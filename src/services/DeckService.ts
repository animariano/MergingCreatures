import { cards } from "../data/cards";

console.log("Cartas cargadas:", cards);

export function createDeck() {
  return [...cards];
}