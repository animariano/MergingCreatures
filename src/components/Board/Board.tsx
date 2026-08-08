import { useState } from "react";

import "./Board.css";
import Card from "../Card/Card";
import { useGame, hayAtacantesDisponibles, hayAccionPrincipalPosible, tieneMalDeInvocacion, tieneFusionDisponible } from "../../hooks/useGame";
import { getDefinition } from "../../data/cards";
import type { Fase } from "../../types/GameState";

const NOMBRES_FASE: Record<Fase, string> = {
  inicio: "Inicio de turno",
  robo: "Fase de robo",
  principal: "Fase principal",
  pelea: "Fase de pelea",
  secundaria: "Fase secundaria",
  fin: "Fin de turno",
};

const FASES_DE_ACCION: Fase[] = ["principal", "secundaria"];

function Board() {
  const { game, dispatch } = useGame();
  const [modoFusion, setModoFusion] = useState(false);
  const [cartaFusionSeleccionada, setCartaFusionSeleccionada] = useState<string | null>(null);
  const [cartaMagicaSeleccionada, setCartaMagicaSeleccionada] = useState<string | null>(null);
  const [atacanteParaBloquear, setAtacanteParaBloquear] = useState<string | null>(null);
  const [cartaEnHover, setCartaEnHover] = useState<string | null>(null);

  const combateEnCurso = game.combateEnCurso;
  const jugadorActivoLabel = game.jugadorActivo === "player" ? "Jugador" : "IA";
  const enFasePelea = game.fase === "pelea";
  const esTurnoDelJugador = game.jugadorActivo === "player";
  const puedeFusionarEsteTurno = FASES_DE_ACCION.includes(game.fase) && !game.fusionoEsteTurno;

  // Mismo criterio que el auto-avance de useGame: si la fase actual no tiene ninguna
  // acción posible, no tiene sentido mostrar el botón para avanzarla a mano — va a
  // avanzar sola en un instante.
  const faseTieneAccionManual =
    (FASES_DE_ACCION.includes(game.fase) && hayAccionPrincipalPosible(game, "player")) ||
    (game.fase === "pelea" && hayAtacantesDisponibles(game, "player"));

  function cancelarSelecciones() {
    setModoFusion(false);
    setCartaFusionSeleccionada(null);
    setCartaMagicaSeleccionada(null);
  }

  function alternarModoFusion() {
    if (modoFusion) {
      cancelarSelecciones();
      return;
    }
    setModoFusion(true);
    setCartaMagicaSeleccionada(null);
  }

  function manejarSeleccionParaFusion(instanceId: string) {
    if (cartaFusionSeleccionada === null) {
      setCartaFusionSeleccionada(instanceId);
      return;
    }

    if (cartaFusionSeleccionada === instanceId) {
      setCartaFusionSeleccionada(null);
      return;
    }

    dispatch({ type: "FUSIONAR", instanceIdA: cartaFusionSeleccionada, instanceIdB: instanceId });
    setCartaFusionSeleccionada(null);
    setModoFusion(false);
  }

  /** Usa la magia/equipo en espera de objetivo sobre la criatura clickeada. */
  function usarComoObjetivo(objetivoId: string) {
    if (cartaMagicaSeleccionada === null) return;

    const def = getDefinition(game.cartas[cartaMagicaSeleccionada].defId);

    if (def.categoria === "magia") {
      dispatch({ type: "JUGAR_MAGIA", instanceId: cartaMagicaSeleccionada, objetivoId });
    } else if (def.categoria === "equipo") {
      dispatch({ type: "EQUIPAR", instanceId: cartaMagicaSeleccionada, objetivoId });
    }

    setCartaMagicaSeleccionada(null);
  }

  function manejarClickCartaEnMano(instanceId: string) {
    if (modoFusion) {
      manejarSeleccionParaFusion(instanceId);
      return;
    }

    if (cartaMagicaSeleccionada !== null) {
      // Mientras se espera un objetivo, un segundo click sobre la misma carta cancela.
      if (cartaMagicaSeleccionada === instanceId) setCartaMagicaSeleccionada(null);
      return;
    }

    const def = getDefinition(game.cartas[instanceId].defId);

    if (def.categoria === "criatura") {
      dispatch({ type: "INVOCAR_CRIATURA", instanceId });
      return;
    }

    // Magia o equipo: queda "en espera", el próximo click en una criatura en juego es el objetivo.
    setModoFusion(false);
    setCartaMagicaSeleccionada(instanceId);
  }

  function manejarClickCriaturaPropia(instanceId: string) {
    if (cartaMagicaSeleccionada !== null) {
      usarComoObjetivo(instanceId);
      return;
    }
    if (modoFusion) {
      manejarSeleccionParaFusion(instanceId);
      return;
    }
    if (enFasePelea && esTurnoDelJugador) {
      dispatch({ type: "DECLARAR_ATACANTE", instanceId });
    }
  }

  function manejarClickCriaturaRival(instanceId: string) {
    if (combateEnCurso !== null && combateEnCurso.atacantes.includes(instanceId)) {
      setAtacanteParaBloquear((actual) => (actual === instanceId ? null : instanceId));
      return;
    }
    if (cartaMagicaSeleccionada !== null) {
      usarComoObjetivo(instanceId);
    }
  }

  /** Asigna la criatura clickeada como bloqueadora del atacante elegido previamente. */
  function manejarClickPosibleBloqueador(bloqueadorId: string) {
    if (combateEnCurso === null || atacanteParaBloquear === null) return;
    dispatch({ type: "ASIGNAR_BLOQUEADOR", atacanteId: atacanteParaBloquear, bloqueadorId });
    setAtacanteParaBloquear(null);
  }

  return (
    <div className="game-layout">
      <div className="preview-panel">
        {cartaEnHover !== null ? (
          <Card instance={game.cartas[cartaEnHover]} />
        ) : (
          <div className="preview-panel-empty">Pasá el mouse por una carta para verla en grande</div>
        )}
      </div>

      <div className="board">
        <div className="player-area enemy">
          <div className="player-info">❤️ IA - Vida: {game.enemy.vida}</div>

          <div className="hand">Mano IA ({game.enemy.mano.length} cartas)</div>

          <div className="field">
            {game.enemy.campo.map((instanceId) => {
              const esAtacanteDeclarado = combateEnCurso?.atacantes.includes(instanceId) ?? false;
              const tieneBloqueadorAsignado = combateEnCurso?.bloqueos[instanceId] !== undefined;

              return (
                <Card
                  key={instanceId}
                  instance={game.cartas[instanceId]}
                  seleccionada={atacanteParaBloquear === instanceId || tieneBloqueadorAsignado}
                  mareada={tieneMalDeInvocacion(game, instanceId)}
                  onMouseEnter={() => setCartaEnHover(instanceId)}
                  onMouseLeave={() => setCartaEnHover(null)}
                  onClick={
                    esAtacanteDeclarado || cartaMagicaSeleccionada !== null
                      ? () => manejarClickCriaturaRival(instanceId)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="player-area player">
        <div className="field">
          {game.player.campo.map((instanceId) => {
            const esBloqueadoraAsignada = combateEnCurso
              ? Object.values(combateEnCurso.bloqueos).includes(instanceId)
              : false;

            return (
              <Card
                key={instanceId}
                instance={game.cartas[instanceId]}
                seleccionada={
                  cartaFusionSeleccionada === instanceId ||
                  game.atacantesDeclarados.includes(instanceId) ||
                  esBloqueadoraAsignada
                }
                mareada={tieneMalDeInvocacion(game, instanceId)}
                fusionDisponible={tieneFusionDisponible(game, "player", instanceId)}
                onMouseEnter={() => setCartaEnHover(instanceId)}
                onMouseLeave={() => setCartaEnHover(null)}
                onClick={
                  combateEnCurso !== null && atacanteParaBloquear !== null
                    ? () => manejarClickPosibleBloqueador(instanceId)
                    : modoFusion || cartaMagicaSeleccionada !== null || (enFasePelea && esTurnoDelJugador)
                    ? () => manejarClickCriaturaPropia(instanceId)
                    : undefined
                }
              />
            );
          })}
        </div>

        <div className="hand">
          {game.player.mano.map((instanceId) => (
            <Card
              key={instanceId}
              instance={game.cartas[instanceId]}
              seleccionada={
                cartaFusionSeleccionada === instanceId || cartaMagicaSeleccionada === instanceId
              }
              fusionDisponible={tieneFusionDisponible(game, "player", instanceId)}
              onMouseEnter={() => setCartaEnHover(instanceId)}
              onMouseLeave={() => setCartaEnHover(null)}
              onClick={() => manejarClickCartaEnMano(instanceId)}
            />
          ))}
        </div>

        <div className="player-info">❤️ Jugador - Vida: {game.player.vida}</div>
      </div>

      <div className="turn-bar">
        <span className="turn-info">
          Turno {game.turno} — {jugadorActivoLabel} — {NOMBRES_FASE[game.fase]}
        </span>

        {!esTurnoDelJugador && combateEnCurso === null && (
          <span className="turn-info">La IA está jugando...</span>
        )}
        {combateEnCurso !== null && (
          <span className="turn-info">
            La IA te está atacando — clickeá un atacante y después tu criatura para bloquearlo (opcional)
          </span>
        )}
        {modoFusion && <span className="turn-info">Elegí 2 criaturas para fusionar</span>}
        {cartaMagicaSeleccionada !== null && (
          <span className="turn-info">Elegí una criatura objetivo (tuya o rival)</span>
        )}

        {combateEnCurso !== null && (
          <button className="end-turn" onClick={() => dispatch({ type: "CONFIRMAR_BLOQUEOS" })}>
            Confirmar bloqueos
          </button>
        )}

        {esTurnoDelJugador && puedeFusionarEsteTurno && (
          <button className="end-turn" onClick={alternarModoFusion}>
            {modoFusion ? "Cancelar fusión" : "Fusionar cartas"}
          </button>
        )}

        {esTurnoDelJugador && enFasePelea && game.atacantesDeclarados.length > 0 && (
          <button className="end-turn" onClick={() => dispatch({ type: "CONFIRMAR_ATAQUE" })}>
            Confirmar ataque ({game.atacantesDeclarados.length})
          </button>
        )}

        {esTurnoDelJugador && faseTieneAccionManual && (
          <button className="end-turn" onClick={() => dispatch({ type: "AVANZAR_FASE" })}>
            Avanzar fase
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

export default Board;
