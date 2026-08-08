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
    image: "/cards/criaturas/tortuga.png",
  },
  {
    id: "aguila",
    categoria: "criatura",
    nombre: "Águila",
    tipo: ["Aire"],
    nivel: 1,
    ataque: 2,
    vida: 2,
    palabrasClave: ["rapidez"],
    image: "/cards/criaturas/aguila.png",
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
    image: "/cards/criaturas/cactus.png",
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
    image: "/cards/criaturas/topo.png",
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
    palabrasClave: ["rapidez"],
    image: "/cards/criaturas/colibri.png",
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
    image: "/cards/criaturas/leon.png",
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
    image: "/cards/criaturas/conejo_fuego.png",
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
    image: "/cards/fusiones/caparazor.png",
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
    image: "/cards/fusiones/ignileon.png",
    palabrasClave: ["arrasar"],
    efectoTexto:
      "Arrasar: al ser bloqueada, si su ataque supera la vida de la bloqueadora, el excedente pasa como daño directo al jugador defensor.",
    esFusion: true,
  },

  // Magias
  {
    id: "vitaminas",
    categoria: "magia",
    nombre: "Vitaminas",
    efectoTexto: "Aumenta el ataque y la vida de una criatura en 2.",
    image: "/cards/magias/vitaminas.png",
  },
  {
    id: "bomba_humo",
    categoria: "magia",
    nombre: "Bomba de Humo",
    efectoTexto: "Regresa una criatura objetivo en juego a la mano de su propietario.",
    image: "/cards/magias/bomba_humo.png",
  },
  {
    id: "disparo_certero",
    categoria: "magia",
    nombre: "Disparo Certero",
    efectoTexto: "La criatura objetivo en juego va a la tumba.",
    image: "/cards/magias/disparo_certero.png",
  },

  // Equipo
  {
    id: "soga",
    categoria: "equipo",
    nombre: "Soga",
    efectoTexto: "La criatura objetivo no puede atacar ni bloquear.",
    image: "/cards/equipo/soga.png",
  },
];

const cardsById = new Map(cardDefinitions.map((c) => [c.id, c]));

export function getDefinition(id: string): CardDefinition {
  const def = cardsById.get(id);
  if (!def) throw new Error(`No existe la definición de carta: ${id}`);
  return def;
}
