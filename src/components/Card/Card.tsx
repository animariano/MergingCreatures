import "./Card.css";

type CardProps = {
  nombre: string;
  ataque: number;
  vida: number;
  tipo: string;
};

export default function Card({
  nombre,
  ataque,
  vida,
  tipo,
}: CardProps) {
  return (
    <div className="card">
      <div className="card-name">{nombre}</div>

      <div className="card-image">Imagen</div>

      <div className="card-type">{tipo}</div>

      <div className="card-stats">
        <span>⚔ {ataque}</span>
        <span>❤️ {vida}</span>
      </div>
    </div>
  );
}