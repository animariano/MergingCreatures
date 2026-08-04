export type Zona = "mazo" | "mano" | "campo" | "tumba";

export interface Buff {
  ataque: number;
  vida: number;
}

export interface CardInstance {
  instanceId: string;
  defId: string;
  zona: Zona;
  /** Daño acumulado. No se regenera solo; distinto de la vida base de la definición. */
  danio: number;
  /** Turno en que entró al campo. null si nunca estuvo en campo. Sirve para mal de invocación. */
  turnoEnCampo: number | null;
  atacoEsteTurno: boolean;
  buffs: Buff[];
  equipos: string[];
}
