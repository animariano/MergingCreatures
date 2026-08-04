export type PlayerId = "player" | "enemy";

export interface Player {
  vida: number;
  mazo: string[];
  mano: string[];
  campo: string[];
  tumba: string[];
}
