import { demoDeckList } from "../data/deckList";
import type { CardInstance } from "../types/CardInstance";

function generarId(): string {
  // crypto.randomUUID existe en todos los navegadores modernos; evitamos depender de libs externas.
  return crypto.randomUUID();
}

function crearInstancia(defId: string): CardInstance {
  return {
    instanceId: generarId(),
    defId,
    zona: "mazo",
    danio: 0,
    turnoEnCampo: null,
    atacoEsteTurno: false,
    buffs: [],
    equipos: [],
  };
}

/** Crea el mazo completo (todas las copias) como instancias nuevas, sin mezclar. */
export function crearMazo(): CardInstance[] {
  const mazo: CardInstance[] = [];

  for (const { defId, cantidad } of demoDeckList) {
    for (let i = 0; i < cantidad; i++) {
      mazo.push(crearInstancia(defId));
    }
  }

  return mazo;
}

export function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}
