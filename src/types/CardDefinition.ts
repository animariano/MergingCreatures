export type CreatureType = "Tierra" | "Aire" | "Agua" | "Fuego" | "Máquina";

/**
 * Palabras clave: habilidades con nombre que se repiten entre criaturas, en vez de un
 * flag booleano nuevo por cada efecto. Agregar una nueva acá + implementar qué hace en
 * useGame.ts (buscar "PalabrasClave" en ese archivo) es todo lo que hace falta para que
 * cualquier criatura futura pueda tenerla, sin tocar el motor de nuevo.
 *
 * - "rapidez": puede atacar el mismo turno que entra al campo (si no la tiene, aplica
 *   el mal de invocación normal).
 * - "arrasar": si es bloqueada y su ataque supera la vida de la bloqueadora, el
 *   excedente pasa como daño directo al jugador defensor.
 */
export type PalabraClave = "rapidez" | "arrasar";

export interface CreatureDefinition {
  id: string;
  categoria: "criatura";
  nombre: string;
  tipo: CreatureType[];
  nivel: number;
  ataque: number;
  vida: number;
  palabrasClave?: PalabraClave[];
  noPuedeAtacar?: boolean;
  noPuedeSerBloqueado?: boolean;
  efectoTexto?: string;
  esFusion: boolean;
  image?: string;
}

export interface MagiaDefinition {
  id: string;
  categoria: "magia";
  nombre: string;
  efectoTexto: string;
  image?: string;
}

export interface EquipoDefinition {
  id: string;
  categoria: "equipo";
  nombre: string;
  efectoTexto: string;
  image?: string;
}

export type CardDefinition = CreatureDefinition | MagiaDefinition | EquipoDefinition;
