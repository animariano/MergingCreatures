import "./Card.css";

import { getDefinition } from "../../data/cards";
import type { CardInstance } from "../../types/CardInstance";

type CardProps = {
  instance: CardInstance;
  /** Solo tiene efecto para cartas de criatura; magias/equipos todavía no son interactuables. */
  onClick?: () => void;
  /** Resalta la carta (por ejemplo: declarada como atacante). */
  seleccionada?: boolean;
  /** Recién invocada este turno (mal de invocación): muestra el ícono de "mareo" superpuesto. */
  mareada?: boolean;
  /** Tiene con qué fusionarse ahora mismo. */
  fusionDisponible?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export default function Card({
  instance,
  onClick,
  seleccionada,
  mareada,
  fusionDisponible,
  onMouseEnter,
  onMouseLeave,
}: CardProps) {
  const def = getDefinition(instance.defId);
  const esCriatura = def.categoria === "criatura";

  const clases = ["card"];
  if (onClick) clases.push("card-clickable");
  if (seleccionada) clases.push("card-seleccionada");
  if (esCriatura && fusionDisponible) clases.push("card-fusion-disponible");

  const buffAtaque = esCriatura ? instance.buffs.reduce((suma, b) => suma + b.ataque, 0) : 0;
  const buffVida = esCriatura ? instance.buffs.reduce((suma, b) => suma + b.vida, 0) : 0;

  const ataqueActual = esCriatura ? def.ataque + buffAtaque : 0;
  const vidaActual = esCriatura ? def.vida + buffVida - instance.danio : 0;

  return (
    <div className={clases.join(" ")} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {def.image ? (
        <img className="card-art" src={def.image} alt={def.nombre} />
      ) : (
        <div className="card-art-placeholder">{def.nombre}</div>
      )}

      {esCriatura && mareada && (
        <img className="card-overlay-mareo" src="/cards/efectos/mareo.png" alt="Mal de invocación" />
      )}

      {esCriatura && (
        <>
          <div className="card-stat card-stat-ataque">{ataqueActual}</div>
          <div className="card-stat card-stat-vida">{vidaActual}</div>
        </>
      )}
    </div>
  );
}
