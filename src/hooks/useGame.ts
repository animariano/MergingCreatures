import { useReducer } from "react";

import { crearMazo, mezclar } from "../services/DeckService";

import type { GameState } from "../types/GameState";
import type { CardInstance } from "../types/CardInstance";
import type { Player, PlayerId } from "../types/Player";

const CARTAS_MANO_INICIAL = 5;

type Accion = { type: "TERMINAR_TURNO" };

function armarJugadorInicial(cartas: Record<string, CardInstance>): Player {
  const mazoMezclado = mezclar(crearMazo());
  const mano = mazoMezclado.slice(0, CARTAS_MANO_INICIAL);
  const restoDelMazo = mazoMezclado.slice(CARTAS_MANO_INICIAL);

  for (const carta of mano) {
    cartas[carta.instanceId] = { ...carta, zona: "mano" };
  }
  for (const carta of restoDelMazo) {
    cartas[carta.instanceId] = carta;
  }

  return {
    vida: 20,
    mazo: restoDelMazo.map((c) => c.instanceId),
    mano: mano.map((c) => c.instanceId),
    campo: [],
    tumba: [],
  };
}

function crearEstadoInicial(): GameState {
  const cartas: Record<string, CardInstance> = {};

  const player = armarJugadorInicial(cartas);
  const enemy = armarJugadorInicial(cartas);

  return {
    turno: 1,
    jugadorActivo: "player",
    fase: "principal",
    cartas,
    player,
    enemy,
    invocoCriaturaEsteTurno: false,
    fusionoEsteTurno: false,
  };
}

/** Mueve la carta de arriba del mazo del jugador indicado a su mano. Si no hay mazo, no hace nada (regla de fatiga: pendiente). */
function robarCarta(state: GameState, jugador: PlayerId): GameState {
  const jugadorState = state[jugador];

  if (jugadorState.mazo.length === 0) {
    return state;
  }

  const [proximaId, ...restoMazo] = jugadorState.mazo;

  return {
    ...state,
    cartas: {
      ...state.cartas,
      [proximaId]: { ...state.cartas[proximaId], zona: "mano" },
    },
    [jugador]: {
      ...jugadorState,
      mazo: restoMazo,
      mano: [...jugadorState.mano, proximaId],
    },
  };
}

function reducer(state: GameState, accion: Accion): GameState {
  switch (accion.type) {
    case "TERMINAR_TURNO": {
      const siguienteJugador: PlayerId = state.jugadorActivo === "player" ? "enemy" : "player";

      const estadoConTurnoNuevo: GameState = {
        ...state,
        jugadorActivo: siguienteJugador,
        turno: state.turno + 1,
        fase: "principal",
        invocoCriaturaEsteTurno: false,
        fusionoEsteTurno: false,
      };

      return robarCarta(estadoConTurnoNuevo, siguienteJugador);
    }

    default:
      return state;
  }
}

export function useGame() {
  const [game, dispatch] = useReducer(reducer, undefined, crearEstadoInicial);

  return { game, dispatch };
}
