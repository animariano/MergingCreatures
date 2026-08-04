export type CardType = "Tierra" | "Aire" | "Agua" | "Fuego" | "Máquina";

export interface CardModel {
  id: string;
  nombre: string;
  tipo: CardType;
  ataque: number;
  vida: number;
}