import type { CreatureType } from "./CardDefinition";

export type FusionInput =
  | { modo: "exacta"; cartaIds: [string, string] }
  | { modo: "tipo"; tipos: [CreatureType, CreatureType] };

export interface FusionDefinition {
  id: string;
  input: FusionInput;
  resultadoId: string;
  /** Usado para repartir probabilidad cuando dos fusiones distintas matchean el mismo par. Default 1. */
  peso?: number;
}
