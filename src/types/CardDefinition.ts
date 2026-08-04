export type CreatureType = "Tierra" | "Aire" | "Agua" | "Fuego" | "Máquina";

export interface CreatureDefinition {
  id: string;
  categoria: "criatura";
  nombre: string;
  tipo: CreatureType[];
  nivel: number;
  ataque: number;
  vida: number;
  puedeAtacarAlEntrar?: boolean;
  noPuedeAtacar?: boolean;
  noPuedeSerBloqueado?: boolean;
  efectoTexto?: string;
  esFusion: boolean;
}

export interface MagiaDefinition {
  id: string;
  categoria: "magia";
  nombre: string;
  efectoTexto: string;
}

export interface EquipoDefinition {
  id: string;
  categoria: "equipo";
  nombre: string;
  efectoTexto: string;
}

export type CardDefinition = CreatureDefinition | MagiaDefinition | EquipoDefinition;
