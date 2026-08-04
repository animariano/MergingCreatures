import type { Player } from "./Player";

export interface GameState {
  player: Player;
  enemy: Player;
  turno: number;
}