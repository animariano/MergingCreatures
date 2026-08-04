import type { FusionDefinition } from "../types/FusionDefinition";

export const fusionDefinitions: FusionDefinition[] = [
  {
    id: "fusion_caparazor",
    input: { modo: "exacta", cartaIds: ["tortuga", "aguila"] },
    resultadoId: "caparazor",
  },
  {
    id: "fusion_ignileon",
    input: { modo: "exacta", cartaIds: ["leon", "conejo_fuego"] },
    resultadoId: "ignileon",
  },
];
