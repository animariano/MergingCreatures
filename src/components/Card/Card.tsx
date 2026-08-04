import "./Card.css";

import { getDefinition } from "../../data/cards";
import type { CardInstance } from "../../types/CardInstance";

type CardProps = {
  instance: CardInstance;
};

export default function Card({ instance }: CardProps) {
  const def = getDefinition(instance.defId);

  if (def.categoria !== "criatura") {
    return (
      <div className="card card-no-criatura">
        <div className="card-name">{def.nombre}</div>
        <div className="card-image">Imagen</div>
        <div className="card-effect">{def.efectoTexto}</div>
      </div>
    );
  }

  const buffAtaque = instance.buffs.reduce((suma, b) => suma + b.ataque, 0);
  const buffVida = instance.buffs.reduce((suma, b) => suma + b.vida, 0);

  const ataqueActual = def.ataque + buffAtaque;
  const vidaActual = def.vida + buffVida - instance.danio;

  return (
    <div className="card">
      <div className="card-name">{def.nombre}</div>
      <div className="card-image">Imagen</div>
      <div className="card-type">{def.tipo.join("/")}</div>
      <div className="card-stats">
        <span>⚔ {ataqueActual}</span>
        <span>❤️ {vidaActual}</span>
      </div>
    </div>
  );
}
