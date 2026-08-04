import type { CardInstance } from "./CardInstance";
import type { Player, PlayerId } from "./Player";

export type Fase = "inicio" | "robo" | "principal" | "pelea" | "secundaria" | "fin";

export interface GameState {
  turno: number;
  jugadorActivo: PlayerId;
  fase: Fase;
  /** Estado normalizado: todas las cartas del juego (mazo, mano, campo, tumba de ambos) viven acá por id. */
  cartas: Record<string, CardInstance>;
  player: Player;
  enemy: Player;
  invocoCriaturaEsteTurno: boolean;
  fusionoEsteTurno: boolean;
}
