import "./Board.css";
import Card from "../Card/Card";
import { useGame } from "../../hooks/useGame";

function Board() {
  const { game, dispatch } = useGame();

  return (
    <div className="board">
      <div className="player-area enemy">
        <div className="player-info">❤️ IA - Vida: {game.enemy.vida}</div>

        <div className="hand">Mano IA ({game.enemy.mano.length} cartas)</div>

        <div className="field">Campo IA</div>
      </div>

      <div className="player-area player">
        <div className="field">Campo Jugador</div>

        <div className="hand">
          {game.player.mano.map((instanceId) => (
            <Card key={instanceId} instance={game.cartas[instanceId]} />
          ))}
        </div>

        <div className="player-info">❤️ Jugador - Vida: {game.player.vida}</div>
      </div>

      <button className="end-turn" onClick={() => dispatch({ type: "TERMINAR_TURNO" })}>
        Finalizar turno (Turno {game.turno} - {game.jugadorActivo === "player" ? "Jugador" : "IA"})
      </button>
    </div>
  );
}

export default Board;
