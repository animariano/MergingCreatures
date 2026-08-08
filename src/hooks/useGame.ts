import { useEffect, useReducer } from "react";

import { crearMazo, mezclar, generarId } from "../services/DeckService";
import { getDefinition } from "../data/cards";
import { fusionDefinitions } from "../data/fusions";

import type { Fase, GameState } from "../types/GameState";
import type { CardInstance, Zona } from "../types/CardInstance";
import type { Player, PlayerId } from "../types/Player";
import type { CreatureDefinition, PalabraClave } from "../types/CardDefinition";
import type { FusionDefinition } from "../types/FusionDefinition";

const CARTAS_MANO_INICIAL = 5;

/** Orden fijo de fases dentro de un turno, tal como las describe el PDF de reglas. */
const ORDEN_FASES: Fase[] = ["inicio", "robo", "principal", "pelea", "secundaria", "fin"];

/** Fases en las que se puede invocar una criatura o hacer una fusión. */
const FASES_DE_ACCION: Fase[] = ["principal", "secundaria"];

type Accion =
  | { type: "AVANZAR_FASE" }
  | { type: "INVOCAR_CRIATURA"; instanceId: string }
  | { type: "DECLARAR_ATACANTE"; instanceId: string }
  | { type: "CONFIRMAR_ATAQUE" }
  | { type: "FUSIONAR"; instanceIdA: string; instanceIdB: string }
  | { type: "JUGAR_MAGIA"; instanceId: string; objetivoId: string }
  | { type: "EQUIPAR"; instanceId: string; objetivoId: string }
  | { type: "ASIGNAR_BLOQUEADOR"; atacanteId: string; bloqueadorId: string }
  | { type: "CONFIRMAR_BLOQUEOS" };

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
    fase: "inicio",
    cartas,
    player,
    enemy,
    invocoCriaturaEsteTurno: false,
    fusionoEsteTurno: false,
    atacantesDeclarados: [],
    combateEnCurso: null,
  };
}

function listaDeZona(jugador: Player, zona: Zona): string[] {
  switch (zona) {
    case "mazo":
      return jugador.mazo;
    case "mano":
      return jugador.mano;
    case "campo":
      return jugador.campo;
    case "tumba":
      return jugador.tumba;
  }
}

/** Mueve una carta de la zona en la que está a otra zona, dentro del mismo jugador.
 *  Punto único donde se mantienen sincronizados `cartas[id].zona` y las listas de `Player`. */
function moverEntreZonas(state: GameState, jugador: PlayerId, instanceId: string, destino: Zona): GameState {
  const jugadorState = state[jugador];
  const origen = state.cartas[instanceId].zona;

  const sinCartaEnOrigen: Player = {
    ...jugadorState,
    [origen]: listaDeZona(jugadorState, origen).filter((id) => id !== instanceId),
  };

  const conCartaEnDestino: Player = {
    ...sinCartaEnOrigen,
    [destino]: [...listaDeZona(sinCartaEnOrigen, destino), instanceId],
  };

  return {
    ...state,
    [jugador]: conCartaEnDestino,
    cartas: {
      ...state.cartas,
      [instanceId]: { ...state.cartas[instanceId], zona: destino },
    },
  };
}

/** Mueve la carta de arriba del mazo del jugador indicado a su mano. Si no hay mazo, no hace nada (regla de fatiga: pendiente). */
function robarCarta(state: GameState, jugador: PlayerId): GameState {
  if (state[jugador].mazo.length === 0) {
    return state;
  }

  const proximaId = state[jugador].mazo[0];

  return moverEntreZonas(state, jugador, proximaId, "mano");
}

function robarCartaDeFase(state: GameState): GameState {
  const esPrimerTurnoDelJugadorInicial = state.turno === 1 && state.jugadorActivo === "player";

  if (esPrimerTurnoDelJugadorInicial) {
    return state;
  }

  return robarCarta(state, state.jugadorActivo);
}

/** Al empezar el turno, las criaturas del jugador activo vuelven a poder atacar. */
function resetearAtaquesDeCriaturas(state: GameState): GameState {
  const idsCampo = state[state.jugadorActivo].campo;
  const cartasActualizadas = { ...state.cartas };

  for (const id of idsCampo) {
    cartasActualizadas[id] = { ...cartasActualizadas[id], atacoEsteTurno: false };
  }

  return { ...state, cartas: cartasActualizadas };
}

/** Efectos automáticos al entrar a una fase. "fin" queda como gancho para cuando existan
 *  efectos de cartas tipo "al final del turno, hace x". */
function aplicarEfectosDeFase(state: GameState, fase: Fase): GameState {
  if (fase === "robo") return robarCartaDeFase(state);
  if (fase === "inicio") return resetearAtaquesDeCriaturas(state);
  return state;
}

function avanzarFase(state: GameState): GameState {
  const indiceActual = ORDEN_FASES.indexOf(state.fase);
  const esFinDeTurno = indiceActual === ORDEN_FASES.length - 1;

  if (esFinDeTurno) {
    const siguienteJugador: PlayerId = state.jugadorActivo === "player" ? "enemy" : "player";

    const estadoConTurnoNuevo: GameState = {
      ...state,
      jugadorActivo: siguienteJugador,
      turno: state.turno + 1,
      fase: "inicio",
      invocoCriaturaEsteTurno: false,
      fusionoEsteTurno: false,
      atacantesDeclarados: [],
    };

    return aplicarEfectosDeFase(estadoConTurnoNuevo, "inicio");
  }

  const siguienteFase = ORDEN_FASES[indiceActual + 1];
  const estadoConFaseNueva: GameState = { ...state, fase: siguienteFase };

  return aplicarEfectosDeFase(estadoConFaseNueva, siguienteFase);
}

function invocarCriatura(state: GameState, instanceId: string): GameState {
  const jugador = state.jugadorActivo;

  if (!FASES_DE_ACCION.includes(state.fase)) return state;
  if (state.invocoCriaturaEsteTurno) return state;
  if (!state[jugador].mano.includes(instanceId)) return state;

  const definicion = getDefinition(state.cartas[instanceId].defId);
  if (definicion.categoria !== "criatura") return state;

  const estadoConCartaEnCampo = moverEntreZonas(state, jugador, instanceId, "campo");

  return {
    ...estadoConCartaEnCampo,
    invocoCriaturaEsteTurno: true,
    cartas: {
      ...estadoConCartaEnCampo.cartas,
      [instanceId]: {
        ...estadoConCartaEnCampo.cartas[instanceId],
        turnoEnCampo: state.turno,
        atacoEsteTurno: false,
      },
    },
  };
}

/** Equipos cuyo efecto es impedir atacar (hoy solo Soga; agregar acá si sumás otros). */
const EQUIPOS_QUE_IMPIDEN_ATACAR = ["soga"];

function tieneEquipoQueImpideAtacar(state: GameState, instancia: CardInstance): boolean {
  return instancia.equipos.some((equipoId) =>
    EQUIPOS_QUE_IMPIDEN_ATACAR.includes(state.cartas[equipoId]?.defId)
  );
}

/** Búsqueda de PalabrasClave: punto único donde se consulta si una criatura tiene una
 *  habilidad con nombre. Agregar una palabra clave nueva no toca esta función. */
function tieneKeyword(def: CreatureDefinition, keyword: PalabraClave): boolean {
  return def.palabrasClave?.includes(keyword) ?? false;
}

/** ¿Esta criatura puede sumarse como atacante ahora mismo? No cubre bloqueo (todavía no existe
 *  quién decida bloquear del otro lado: eso llega con la IA). */
export function puedeAtacar(state: GameState, instanceId: string): boolean {
  const instancia = state.cartas[instanceId];
  const def = getDefinition(instancia.defId);

  if (def.categoria !== "criatura") return false;
  if (def.noPuedeAtacar) return false;
  if (instancia.atacoEsteTurno) return false;
  if (tieneEquipoQueImpideAtacar(state, instancia)) return false;

  const entroEsteTurno = instancia.turnoEnCampo === state.turno;
  if (entroEsteTurno && !tieneKeyword(def, "rapidez")) return false;

  return true;
}

/** ¿Tiene el jugador indicado alguna criatura que pueda sumarse como atacante ahora mismo? */
export function hayAtacantesDisponibles(state: GameState, jugador: PlayerId): boolean {
  return state[jugador].campo.some((id) => puedeAtacar(state, id));
}

/** Mal de invocación: entró al campo este mismo turno y no tiene "rapidez". Se usa solo
 *  para el ícono de "mareo" superpuesto — no confundir con `puedeAtacar`, que además
 *  contempla si ya atacó o si tiene un equipo que se lo impide. */
export function tieneMalDeInvocacion(state: GameState, instanceId: string): boolean {
  const instancia = state.cartas[instanceId];
  const def = getDefinition(instancia.defId);

  if (def.categoria !== "criatura") return false;
  if (tieneKeyword(def, "rapidez")) return false;

  return instancia.turnoEnCampo === state.turno;
}

/** Ataque/vida actuales de una criatura (base + buffs, y en el caso de vida, menos el daño
 *  acumulado). Centralizado acá porque tanto el combate como (eventualmente) el resto del
 *  motor lo necesitan; la UI hace el mismo cálculo por su cuenta para no acoplar render con reducer. */
function ataqueActualDe(state: GameState, instanceId: string): number {
  const instancia = state.cartas[instanceId];
  const def = getDefinition(instancia.defId);
  if (def.categoria !== "criatura") return 0;

  const buffAtaque = instancia.buffs.reduce((suma, b) => suma + b.ataque, 0);
  return def.ataque + buffAtaque;
}

function vidaActualDe(state: GameState, instanceId: string): number {
  const instancia = state.cartas[instanceId];
  const def = getDefinition(instancia.defId);
  if (def.categoria !== "criatura") return 0;

  const buffVida = instancia.buffs.reduce((suma, b) => suma + b.vida, 0);
  return def.vida + buffVida - instancia.danio;
}

function puedeBloquear(state: GameState, instanceId: string): boolean {
  const instancia = state.cartas[instanceId];
  const def = getDefinition(instancia.defId);
  if (def.categoria !== "criatura") return false;
  if (tieneEquipoQueImpideAtacar(state, instancia)) return false; // Soga: "no puede atacar o bloquear"

  return true;
}

/** ¿Tiene sentido siquiera preguntarle al defensor si quiere bloquear? No, si no le queda
 *  ninguna criatura habilitada para bloquear, o si todos los atacantes son "no puede ser
 *  bloqueado" (Topo). En esos casos el combate se resuelve directo, sin pausar. */
function hayBloqueoPosible(state: GameState, atacantes: string[], defensor: PlayerId): boolean {
  const hayBloqueadorDisponible = state[defensor].campo.some((id) => puedeBloquear(state, id));
  if (!hayBloqueadorDisponible) return false;

  return atacantes.some((atacanteId) => {
    const def = getDefinition(state.cartas[atacanteId].defId);
    return !(def.categoria === "criatura" && def.noPuedeSerBloqueado);
  });
}

/**
 * Heurística de bloqueo (la usan tanto la IA defendiendo como, por ahora, el jugador cuando
 * lo ataca la IA — todavía no hay UI para que un humano elija bloqueadores a mano, así que
 * ambos lados usan la misma lógica automática hasta que se construya esa pantalla). Bloquea
 * a los atacantes más fuertes primero, con la primera criatura disponible que pueda bloquear;
 * respeta que Topo no puede ser bloqueado.
 */
function decidirBloqueos(state: GameState, atacantesIds: string[], defensor: PlayerId): Record<string, string> {
  const disponibles = state[defensor].campo.filter((id) => puedeBloquear(state, id));
  const atacantesOrdenados = [...atacantesIds].sort(
    (a, b) => ataqueActualDe(state, b) - ataqueActualDe(state, a)
  );

  const bloqueos: Record<string, string> = {};

  for (const atacanteId of atacantesOrdenados) {
    const defAtacante = getDefinition(state.cartas[atacanteId].defId);
    if (defAtacante.categoria === "criatura" && defAtacante.noPuedeSerBloqueado) continue;
    if (disponibles.length === 0) break;

    bloqueos[atacanteId] = disponibles.shift()!;
  }

  return bloqueos;
}

/** Manda a la tumba cualquier criatura del campo de `jugador` cuya vida actual haya llegado a 0. */
function aplicarMuertes(state: GameState, jugador: PlayerId): GameState {
  let estado = state;

  for (const id of [...estado[jugador].campo]) {
    if (vidaActualDe(estado, id) <= 0) {
      estado = moverEntreZonas(estado, jugador, id, "tumba");
    }
  }

  return estado;
}

function alternarAtacante(state: GameState, instanceId: string): GameState {
  if (state.fase !== "pelea") return state;

  const jugador = state.jugadorActivo;
  if (!state[jugador].campo.includes(instanceId)) return state;

  const yaDeclarado = state.atacantesDeclarados.includes(instanceId);

  if (yaDeclarado) {
    return {
      ...state,
      atacantesDeclarados: state.atacantesDeclarados.filter((id) => id !== instanceId),
    };
  }

  if (!puedeAtacar(state, instanceId)) return state;

  return { ...state, atacantesDeclarados: [...state.atacantesDeclarados, instanceId] };
}

/**
 * Aplica el daño de un combate ya resuelto (atacantes + bloqueos definidos) y revisa
 * muertes de ambos lados. Único punto donde se calcula daño de combate, lo use quien lo use:
 * la heurística automática o la confirmación manual del jugador.
 */
function resolverCombate(
  state: GameState,
  rival: PlayerId,
  atacantes: string[],
  bloqueos: Record<string, string>
): GameState {
  const jugadorAtacante: PlayerId = rival === "player" ? "enemy" : "player";

  let cartasActualizadas = { ...state.cartas };
  let danioDirectoAlRival = 0;

  for (const atacanteId of atacantes) {
    const bloqueadorId = bloqueos[atacanteId];

    if (!bloqueadorId) {
      danioDirectoAlRival += ataqueActualDe(state, atacanteId);
      continue;
    }

    const ataqueAtacante = ataqueActualDe(state, atacanteId);
    const ataqueBloqueador = ataqueActualDe(state, bloqueadorId);

    cartasActualizadas[bloqueadorId] = {
      ...cartasActualizadas[bloqueadorId],
      danio: cartasActualizadas[bloqueadorId].danio + ataqueAtacante,
    };
    cartasActualizadas[atacanteId] = {
      ...cartasActualizadas[atacanteId],
      danio: cartasActualizadas[atacanteId].danio + ataqueBloqueador,
    };

    // Arrasar: el excedente de ataque por sobre la vida de la bloqueadora (al momento de
    // bloquear, antes de aplicarle este mismo daño) pasa directo al jugador defensor.
    const defAtacante = getDefinition(state.cartas[atacanteId].defId);
    if (defAtacante.categoria === "criatura" && tieneKeyword(defAtacante, "arrasar")) {
      const vidaBloqueadorAlBloquear = vidaActualDe(state, bloqueadorId);
      const excedente = ataqueAtacante - vidaBloqueadorAlBloquear;
      if (excedente > 0) danioDirectoAlRival += excedente;
    }
  }

  let estadoResuelto: GameState = {
    ...state,
    cartas: cartasActualizadas,
    [rival]: { ...state[rival], vida: state[rival].vida - danioDirectoAlRival },
    combateEnCurso: null,
  };

  estadoResuelto = aplicarMuertes(estadoResuelto, jugadorAtacante);
  estadoResuelto = aplicarMuertes(estadoResuelto, rival);

  return estadoResuelto;
}

/**
 * Declara en firme a los atacantes ya seleccionados. Si el rival es la IA, bloquea sola con
 * la heurística y el combate se resuelve en el acto. Si el rival es el jugador humano, el
 * combate queda pendiente (`combateEnCurso`) hasta que elija bloqueadores a mano.
 */
function confirmarAtaque(state: GameState): GameState {
  if (state.fase !== "pelea") return state;
  if (state.atacantesDeclarados.length === 0) return state;

  const jugador = state.jugadorActivo;
  const rival: PlayerId = jugador === "player" ? "enemy" : "player";
  const atacantes = state.atacantesDeclarados;

  const cartasActualizadas = { ...state.cartas };
  for (const id of atacantes) {
    cartasActualizadas[id] = { ...cartasActualizadas[id], atacoEsteTurno: true };
  }

  const estadoConAtaqueDeclarado: GameState = {
    ...state,
    cartas: cartasActualizadas,
    atacantesDeclarados: [],
  };

  if (rival === "player") {
    if (!hayBloqueoPosible(estadoConAtaqueDeclarado, atacantes, rival)) {
      return resolverCombate(estadoConAtaqueDeclarado, rival, atacantes, {});
    }
    return { ...estadoConAtaqueDeclarado, combateEnCurso: { atacantes, bloqueos: {} } };
  }

  const bloqueos = decidirBloqueos(estadoConAtaqueDeclarado, atacantes, rival);
  return resolverCombate(estadoConAtaqueDeclarado, rival, atacantes, bloqueos);
}

/**
 * El jugador humano (siempre defensor en este flujo) asigna o quita una criatura suya como
 * bloqueadora de un atacante puntual. Una bloqueadora solo puede cubrir un ataque a la vez
 * (si ya estaba asignada a otro atacante, se la saca de ahí). Clickear la misma pareja de
 * nuevo desasigna.
 */
function asignarBloqueador(state: GameState, atacanteId: string, bloqueadorId: string): GameState {
  if (state.combateEnCurso === null) return state;
  if (!state.combateEnCurso.atacantes.includes(atacanteId)) return state;

  const defAtacante = getDefinition(state.cartas[atacanteId].defId);
  if (defAtacante.categoria === "criatura" && defAtacante.noPuedeSerBloqueado) return state;

  if (!state.player.campo.includes(bloqueadorId)) return state;
  if (!puedeBloquear(state, bloqueadorId)) return state;

  const bloqueosActuales = state.combateEnCurso.bloqueos;

  if (bloqueosActuales[atacanteId] === bloqueadorId) {
    const bloqueosSinEsteAtacante = Object.fromEntries(
      Object.entries(bloqueosActuales).filter(([idAtacante]) => idAtacante !== atacanteId)
    );

    return { ...state, combateEnCurso: { ...state.combateEnCurso, bloqueos: bloqueosSinEsteAtacante } };
  }

  const bloqueosSinEsteBloqueador = Object.fromEntries(
    Object.entries(bloqueosActuales).filter(([, idBloqueador]) => idBloqueador !== bloqueadorId)
  );

  return {
    ...state,
    combateEnCurso: {
      ...state.combateEnCurso,
      bloqueos: { ...bloqueosSinEsteBloqueador, [atacanteId]: bloqueadorId },
    },
  };
}

/** El jugador humano termina de elegir bloqueadores (incluso si dejó ataques sin bloquear a propósito). */
function confirmarBloqueos(state: GameState): GameState {
  if (state.combateEnCurso === null) return state;

  const { atacantes, bloqueos } = state.combateEnCurso;
  return resolverCombate(state, "player", atacantes, bloqueos);
}



/** ¿Este par de criaturas dispara esta fusión? El orden entre A y B no importa. */
function coincideFusion(fusion: FusionDefinition, defA: CreatureDefinition, defB: CreatureDefinition): boolean {
  if (fusion.input.modo === "exacta") {
    const [idA, idB] = fusion.input.cartaIds;
    return (defA.id === idA && defB.id === idB) || (defA.id === idB && defB.id === idA);
  }

  const [tipoA, tipoB] = fusion.input.tipos;
  const aCubreA = defA.tipo.includes(tipoA) && defB.tipo.includes(tipoB);
  const aCubreB = defA.tipo.includes(tipoB) && defB.tipo.includes(tipoA);

  return aCubreA || aCubreB;
}

/** Todas las fusiones que matchean el par. Puede haber más de una si se superponen
 *  (ej. una exacta y una por tipo); eso se resuelve al azar más abajo. */
function buscarFusionesPosibles(defA: CreatureDefinition, defB: CreatureDefinition): FusionDefinition[] {
  return fusionDefinitions.filter((fusion) => coincideFusion(fusion, defA, defB));
}

/** Todas las criaturas propias disponibles para invocar o fusionar (mano + campo). */
function criaturasDisponiblesDe(
  state: GameState,
  jugador: PlayerId
): { instanceId: string; def: CreatureDefinition }[] {
  const resultado: { instanceId: string; def: CreatureDefinition }[] = [];

  for (const instanceId of [...state[jugador].mano, ...state[jugador].campo]) {
    const def = getDefinition(state.cartas[instanceId].defId);
    if (def.categoria === "criatura") resultado.push({ instanceId, def });
  }

  return resultado;
}

function hayInvocacionPosible(state: GameState, jugador: PlayerId): boolean {
  if (state.invocoCriaturaEsteTurno) return false;

  return state[jugador].mano.some((id) => getDefinition(state.cartas[id].defId).categoria === "criatura");
}

/** ¿Hay al menos un par de criaturas propias (mano/campo, cualquier combinación) que
 *  dispare alguna fusión? */
function hayFusionPosible(state: GameState, jugador: PlayerId): boolean {
  if (state.fusionoEsteTurno) return false;

  const criaturas = criaturasDisponiblesDe(state, jugador);

  for (let i = 0; i < criaturas.length; i++) {
    for (let j = i + 1; j < criaturas.length; j++) {
      if (buscarFusionesPosibles(criaturas[i].def, criaturas[j].def).length > 0) return true;
    }
  }

  return false;
}

/** ¿Esta criatura puntual (mano o campo) tiene con qué fusionarse ahora mismo? Se usa para
 *  el brillo dorado en la carta, no solo para saber si "hay alguna fusión en general". */
export function tieneFusionDisponible(state: GameState, jugador: PlayerId, instanceId: string): boolean {
  if (state.fusionoEsteTurno) return false;
  if (!FASES_DE_ACCION.includes(state.fase)) return false;

  const defPropia = getDefinition(state.cartas[instanceId].defId);
  if (defPropia.categoria !== "criatura") return false;

  return criaturasDisponiblesDe(state, jugador).some(
    ({ instanceId: otroId, def }) => otroId !== instanceId && buscarFusionesPosibles(defPropia, def).length > 0
  );
}

function hayMagiaOEquipoJugable(state: GameState, jugador: PlayerId): boolean {
  const hayObjetivoEnJuego = state.player.campo.length > 0 || state.enemy.campo.length > 0;
  if (!hayObjetivoEnJuego) return false;

  return state[jugador].mano.some((id) => {
    const categoria = getDefinition(state.cartas[id].defId).categoria;
    return categoria === "magia" || categoria === "equipo";
  });
}

/** ¿Hay alguna acción posible en fase principal/secundaria? Invocar, fusionar, o jugar
 *  alguna magia/equipo. Si no hay nada de esto, la fase avanza sola (ver `useGame`). */
export function hayAccionPrincipalPosible(state: GameState, jugador: PlayerId): boolean {
  return (
    hayInvocacionPosible(state, jugador) ||
    hayFusionPosible(state, jugador) ||
    hayMagiaOEquipoJugable(state, jugador)
  );
}

/** Reparte probabilidad según `peso` (default 1 = todas iguales) y elige una al azar. */
function elegirFusionAlAzar(fusiones: FusionDefinition[]): FusionDefinition {
  const pesos = fusiones.map((f) => f.peso ?? 1);
  const pesoTotal = pesos.reduce((suma, p) => suma + p, 0);

  let umbral = Math.random() * pesoTotal;

  for (let i = 0; i < fusiones.length; i++) {
    umbral -= pesos[i];
    if (umbral <= 0) return fusiones[i];
  }

  return fusiones[fusiones.length - 1];
}

/**
 * Fusiona dos criaturas del jugador activo (pueden estar en su mano o en su campo, en
 * cualquier combinación). Las dos van a la tumba y nace una instancia nueva de la carta
 * resultado en el campo. Es no-op si el par no tiene ninguna fusión definida, si ya se
 * fusionó este turno, o si las cartas no son criaturas propias disponibles.
 */
function fusionar(state: GameState, instanceIdA: string, instanceIdB: string): GameState {
  if (!FASES_DE_ACCION.includes(state.fase)) return state;
  if (state.fusionoEsteTurno) return state;
  if (instanceIdA === instanceIdB) return state;

  const jugador = state.jugadorActivo;
  const jugadorState = state[jugador];

  const disponible = (id: string) => jugadorState.mano.includes(id) || jugadorState.campo.includes(id);
  if (!disponible(instanceIdA) || !disponible(instanceIdB)) return state;

  const defA = getDefinition(state.cartas[instanceIdA].defId);
  const defB = getDefinition(state.cartas[instanceIdB].defId);
  if (defA.categoria !== "criatura" || defB.categoria !== "criatura") return state;

  const fusionesPosibles = buscarFusionesPosibles(defA, defB);
  if (fusionesPosibles.length === 0) return state;

  const fusionElegida = elegirFusionAlAzar(fusionesPosibles);
  const defResultado = getDefinition(fusionElegida.resultadoId);
  if (defResultado.categoria !== "criatura") return state;

  let estadoConTumba = moverEntreZonas(state, jugador, instanceIdA, "tumba");
  estadoConTumba = moverEntreZonas(estadoConTumba, jugador, instanceIdB, "tumba");

  const nuevaInstancia: CardInstance = {
    instanceId: generarId(),
    defId: defResultado.id,
    zona: "campo",
    danio: 0,
    turnoEnCampo: state.turno,
    atacoEsteTurno: false,
    buffs: [],
    equipos: [],
  };

  return {
    ...estadoConTumba,
    [jugador]: {
      ...estadoConTumba[jugador],
      campo: [...estadoConTumba[jugador].campo, nuevaInstancia.instanceId],
    },
    cartas: {
      ...estadoConTumba.cartas,
      [nuevaInstancia.instanceId]: nuevaInstancia,
    },
    fusionoEsteTurno: true,
  };
}

function propietarioDe(state: GameState, instanceId: string): PlayerId {
  return state.player.campo.includes(instanceId) ? "player" : "enemy";
}

/** Vitaminas: +2/+2 permanente sobre la instancia objetivo. */
function aplicarVitaminas(state: GameState, objetivoId: string): GameState {
  const instancia = state.cartas[objetivoId];

  return {
    ...state,
    cartas: {
      ...state.cartas,
      [objetivoId]: { ...instancia, buffs: [...instancia.buffs, { ataque: 2, vida: 2 }] },
    },
  };
}

/** Bomba de humo: la criatura vuelve a la mano de su dueño. Al volver se resetea
 *  (sin daño, sin buffs, sin equipos) porque es una carta "nueva" hasta que se reinvoque. */
function aplicarBombaDeHumo(state: GameState, objetivoId: string): GameState {
  const propietario = propietarioDe(state, objetivoId);
  const estadoConCartaEnMano = moverEntreZonas(state, propietario, objetivoId, "mano");

  return {
    ...estadoConCartaEnMano,
    cartas: {
      ...estadoConCartaEnMano.cartas,
      [objetivoId]: {
        ...estadoConCartaEnMano.cartas[objetivoId],
        danio: 0,
        buffs: [],
        equipos: [],
        turnoEnCampo: null,
        atacoEsteTurno: false,
      },
    },
  };
}

/** Disparo certero: la criatura objetivo va directo a la tumba de su dueño. */
function aplicarDisparoCertero(state: GameState, objetivoId: string): GameState {
  return moverEntreZonas(state, propietarioDe(state, objetivoId), objetivoId, "tumba");
}

const EFECTOS_MAGIA: Record<string, (state: GameState, objetivoId: string) => GameState> = {
  vitaminas: aplicarVitaminas,
  bomba_humo: aplicarBombaDeHumo,
  disparo_certero: aplicarDisparoCertero,
};

/**
 * Juega una carta de magia de la mano del jugador activo sobre una criatura objetivo en
 * juego (propia o rival, las reglas no restringen el dueño). La magia se manda a la tumba
 * después de resolverse. No hay límite de magias por turno.
 */
function jugarMagia(state: GameState, instanceId: string, objetivoId: string): GameState {
  if (!FASES_DE_ACCION.includes(state.fase)) return state;

  const jugador = state.jugadorActivo;
  if (!state[jugador].mano.includes(instanceId)) return state;

  const def = getDefinition(state.cartas[instanceId].defId);
  if (def.categoria !== "magia") return state;

  const objetivoEnJuego = state.player.campo.includes(objetivoId) || state.enemy.campo.includes(objetivoId);
  if (!objetivoEnJuego) return state;

  const resolverEfecto = EFECTOS_MAGIA[def.id];
  if (!resolverEfecto) return state; // magia sin efecto implementado todavía

  const estadoConEfecto = resolverEfecto(state, objetivoId);

  return moverEntreZonas(estadoConEfecto, jugador, instanceId, "tumba");
}

/**
 * Equipa una carta de equipo de la mano sobre una criatura objetivo en juego. El equipo
 * queda "adjunto" (su instancia sale de la mano pero no entra a la lista de campo, para no
 * pintarse como una carta más en el tablero) y su id se agrega a `equipos` de la criatura.
 */
function equipar(state: GameState, instanceId: string, objetivoId: string): GameState {
  if (!FASES_DE_ACCION.includes(state.fase)) return state;

  const jugador = state.jugadorActivo;
  if (!state[jugador].mano.includes(instanceId)) return state;

  const def = getDefinition(state.cartas[instanceId].defId);
  if (def.categoria !== "equipo") return state;

  const objetivoEnJuego = state.player.campo.includes(objetivoId) || state.enemy.campo.includes(objetivoId);
  if (!objetivoEnJuego) return state;

  const objetivoInstancia = state.cartas[objetivoId];

  return {
    ...state,
    [jugador]: {
      ...state[jugador],
      mano: state[jugador].mano.filter((id) => id !== instanceId),
    },
    cartas: {
      ...state.cartas,
      [instanceId]: { ...state.cartas[instanceId], zona: "campo" },
      [objetivoId]: { ...objetivoInstancia, equipos: [...objetivoInstancia.equipos, instanceId] },
    },
  };
}

/**
 * IA mínima: una acción por llamada. `useGame` la vuelve a invocar en cada render mientras
 * sea el turno de la IA, así que esto funciona como un paso a paso — invocar, declarar
 * atacantes de a uno, confirmar, avanzar fase — hasta devolver el turno al jugador.
 * No fusiona (elegir un par válido a ciegas no es trivial) y no juega magias/equipos: son
 * simplificaciones a propósito, no bugs.
 */
function decidirAccionIA(state: GameState): Accion {
  const jugador = state.jugadorActivo;

  if (FASES_DE_ACCION.includes(state.fase) && !state.invocoCriaturaEsteTurno) {
    const criaturaInvocable = state[jugador].mano.find((id) => {
      const def = getDefinition(state.cartas[id].defId);
      return def.categoria === "criatura";
    });

    if (criaturaInvocable) return { type: "INVOCAR_CRIATURA", instanceId: criaturaInvocable };
  }

  if (state.fase === "pelea") {
    const atacanteDisponible = state[jugador].campo.find(
      (id) => puedeAtacar(state, id) && !state.atacantesDeclarados.includes(id)
    );
    if (atacanteDisponible) return { type: "DECLARAR_ATACANTE", instanceId: atacanteDisponible };
    if (state.atacantesDeclarados.length > 0) return { type: "CONFIRMAR_ATAQUE" };
  }

  return { type: "AVANZAR_FASE" };
}

function reducer(state: GameState, accion: Accion): GameState {
  // Con un combate pendiente de bloqueo, solo se aceptan acciones de bloqueo: todo lo demás
  // (invocar, fusionar, avanzar fase, etc.) espera a que el jugador termine de decidir.
  if (state.combateEnCurso !== null && accion.type !== "ASIGNAR_BLOQUEADOR" && accion.type !== "CONFIRMAR_BLOQUEOS") {
    return state;
  }

  switch (accion.type) {
    case "AVANZAR_FASE":
      return avanzarFase(state);

    case "INVOCAR_CRIATURA":
      return invocarCriatura(state, accion.instanceId);

    case "DECLARAR_ATACANTE":
      return alternarAtacante(state, accion.instanceId);

    case "CONFIRMAR_ATAQUE":
      return confirmarAtaque(state);

    case "FUSIONAR":
      return fusionar(state, accion.instanceIdA, accion.instanceIdB);

    case "JUGAR_MAGIA":
      return jugarMagia(state, accion.instanceId, accion.objetivoId);

    case "EQUIPAR":
      return equipar(state, accion.instanceId, accion.objetivoId);

    case "ASIGNAR_BLOQUEADOR":
      return asignarBloqueador(state, accion.atacanteId, accion.bloqueadorId);

    case "CONFIRMAR_BLOQUEOS":
      return confirmarBloqueos(state);

    default:
      return state;
  }
}

export function useGame() {
  const [game, dispatch] = useReducer(reducer, undefined, crearEstadoInicial);

  useEffect(() => {
    if (game.jugadorActivo !== "enemy") return;
    if (game.combateEnCurso !== null) return; // esperando que el jugador elija bloqueadores

    const timer = setTimeout(() => {
      dispatch(decidirAccionIA(game));
    }, 600);

    return () => clearTimeout(timer);
  }, [game]);

  // "inicio", "robo" y "fin" no tienen ninguna acción posible para el jugador humano
  // (hoy); "pelea" tampoco si no le queda ninguna criatura habilitada para atacar.
  // En esos casos avanzamos la fase solos, para no obligar a clickear "Avanzar fase"
  // en pasos que no requieren ninguna decisión.
  useEffect(() => {
    if (game.jugadorActivo !== "player") return;

    const faseSinAccionPosible =
      game.fase === "inicio" ||
      game.fase === "robo" ||
      game.fase === "fin" ||
      (game.fase === "pelea" && !hayAtacantesDisponibles(game, "player")) ||
      ((game.fase === "principal" || game.fase === "secundaria") && !hayAccionPrincipalPosible(game, "player"));

    if (!faseSinAccionPosible) return;

    const timer = setTimeout(() => {
      dispatch({ type: "AVANZAR_FASE" });
    }, 350);

    return () => clearTimeout(timer);
  }, [game]);

  return { game, dispatch };
}
