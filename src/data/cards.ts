import type { CardDefinition } from "../types/CardDefinition";

export const cardDefinitions: CardDefinition[] = [
  // Criaturas base
  {
    id: "tortuga",
    categoria: "criatura",
    nombre: "Tortuga",
    tipo: ["Tierra"],
    nivel: 1,
    ataque: 1,
    vida: 4,
    esFusion: false,
  },
  {
    id: "aguila",
    categoria: "criatura",
    nombre: "Águila",
    tipo: ["Aire"],
    nivel: 1,
    ataque: 2,
    vida: 2,
    puedeAtacarAlEntrar: true,
    esFusion: false,
  },
  {
    id: "cactus",
    categoria: "criatura",
    nombre: "Cactus",
    tipo: ["Tierra"],
    nivel: 1,
    ataque: 2,
    vida: 3,
    noPuedeAtacar: true,
    esFusion: false,
  },
  {
    id: "topo",
    categoria: "criatura",
    nombre: "Topo",
    tipo: ["Tierra"],
    nivel: 1,
    ataque: 1,
    vida: 2,
    noPuedeSerBloqueado: true,
    esFusion: false,
  },
  {
    id: "colibri",
    categoria: "criatura",
    nombre: "Colibrí",
    tipo: ["Aire"],
    nivel: 1,
    ataque: 3,
    vida: 1,
    puedeAtacarAlEntrar: true,
    esFusion: false,
  },
  {
    id: "leon",
    categoria: "criatura",
    nombre: "León",
    tipo: ["Tierra"],
    nivel: 1,
    ataque: 3,
    vida: 3,
    esFusion: false,
  },
  {
    id: "conejo_fuego",
    categoria: "criatura",
    nombre: "Conejo de Fuego",
    tipo: ["Fuego"],
    nivel: 1,
    ataque: 2,
    vida: 1,
    esFusion: false,
  },

  // Fusiones
  {
    id: "caparazor",
    categoria: "criatura",
    nombre: "Caparazor",
    tipo: ["Tierra", "Aire"],
    nivel: 2,
    ataque: 3,
    vida: 6,
    esFusion: true,
  },
  {
    id: "ignileon",
    categoria: "criatura",
    nombre: "Ignileón",
    tipo: ["Tierra", "Fuego"],
    nivel: 2,
    ataque: 6,
    vida: 6,
    efectoTexto:
      "Al ser bloqueado, inflige daño al oponente igual a la diferencia entre su ataque y la vida de la criatura bloqueadora.",
    esFusion: true,
  },

  // Magias
  {
    id: "vitaminas",
    categoria: "magia",
    nombre: "Vitaminas",
    efectoTexto: "Aumenta el ataque y la vida de una criatura en 1.",
  },
  {
    id: "bomba_humo",
    categoria: "magia",
    nombre: "Bomba de Humo",
    efectoTexto: "Regresa una criatura objetivo en juego a la mano de su propietario.",
  },
  {
    id: "disparo_certero",
    categoria: "magia",
    nombre: "Disparo Certero",
    efectoTexto: "La criatura objetivo en juego va a la tumba.",
  },

  // Equipo
  {
    id: "soga",
    categoria: "equipo",
    nombre: "Soga",
    efectoTexto: "La criatura objetivo no puede atacar ni bloquear.",
  },
];

const cardsById = new Map(cardDefinitions.map((c) => [c.id, c]));

export function getDefinition(id: string): CardDefinition {
  const def = cardsById.get(id);
  if (!def) throw new Error(`No existe la definición de carta: ${id}`);
  return def;
}
