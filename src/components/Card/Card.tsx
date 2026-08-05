import "./Card.css";

import { getDefinition } from "../../data/cards";
import type { CardInstance } from "../../types/CardInstance";

type CardProps = {
  instance: CardInstance;
  /** Solo tiene efecto para cartas de criatura; magias/equipos todavía no son interactuables. */
  onClick?: () => void;
  /** Resalta la carta (por ejemplo: declarada como atacante). */
  seleccionada?: boolean;
};

export default function Card({ instance, onClick, seleccionada }: CardProps) {
  const def = getDefinition(instance.defId);

  if (def.categoria !== "criatura") {
    const clasesNoCriatura = ["card", "card-no-criatura"];
    if (onClick) clasesNoCriatura.push("card-clickable");
    if (seleccionada) clasesNoCriatura.push("card-seleccionada");

    return (
      <div className={clasesNoCriatura.join(" ")} onClick={onClick}>
        <div className="card-name">{def.nombre}</div>
        <div className="card-image">
        <img src={def.image} alt={def.nombre} />
        </div>
        <div className="card-effect">{def.efectoTexto}</div>
      </div>
    );
  }

  const buffAtaque = instance.buffs.reduce((suma, b) => suma + b.ataque, 0);
  const buffVida = instance.buffs.reduce((suma, b) => suma + b.vida, 0);

  const ataqueActual = def.ataque + buffAtaque;
  const vidaActual = def.vida + buffVida - instance.danio;

  const clases = ["card"];
  if (onClick) clases.push("card-clickable");
  if (seleccionada) clases.push("card-seleccionada");

  return (
    <div className={clases.join(" ")} onClick={onClick}>
      <div className="card-name">{def.nombre}</div>

      <div className="card-image">
        <img src={def.image} alt={def.nombre} />
      </div>

      <div className="card-type">{def.tipo.join("/")}</div>
      <div className="card-stats">
        <span>⚔ {ataqueActual}</span>
        <span>❤️ {vidaActual}</span>
      </div>
    </div>
  );
}
