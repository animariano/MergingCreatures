import "./Board.css";
import Card from "../Card/Card";
import { useGame } from "../../hooks/useGame";


function Board() {
  const game = useGame();
  return (
    <div className="board">

      <div className="player-area enemy">
        <div className="player-info">
          ❤️ IA - Vida: 20
        </div>

        <div className="hand">
          Mano IA
        </div>

        <div className="field">
          Campo IA
        </div>
      </div>

      <div className="player-area player">
        <div className="field">
          Campo Jugador
        </div>

<div className="hand">
  {game.player.mano.map((carta) => (
    <Card
      key={carta.id}
      nombre={carta.nombre}
      ataque={carta.ataque}
      vida={carta.vida}
      tipo={carta.tipo}
    />
  ))}
</div>

        <div className="player-info">
          ❤️ Jugador - Vida: 20
        </div>
      </div>

      <button className="end-turn">
        Finalizar turno
      </button>

    </div>
  );
}

export default Board;