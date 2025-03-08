// MapConfig.js
import floorImg from './assets/floor.png';
import wallImg from './assets/wall.png';
import breakableImg from './assets/breakable.png';
import enemyImg from './assets/enemy.png';
import player1Img from './assets/player1.png';
import player2Img from './assets/player2.png';
import rockImg from './assets/rock.png';
import explosionImg from './assets/explosion.png';

export const maps = [
  {
    name: 'Mapa 1',
    width: 15,
    height: 13,
    tileSize: 32,
    textures: {
      floor: floorImg,
      wall: wallImg,
      breakable: breakableImg,
      enemy: enemyImg,
      player1: player1Img,
      player2: player2Img,
      rock: rockImg,
      explosion: explosionImg,
    },
    layout: {
      walls: (row, col) => row === 0 || row === 12 || col === 0 || col === 14 || (row % 2 === 0 && col % 2 === 0),
      breakables: [
        { x: 3, y: 3 },
        { x: 5, y: 7 },
        { x: 9, y: 5 },
        { x: 11, y: 9 },
        { x: 7, y: 11 },
      ],
      enemies: [
        { x: 5, y: 5 },
        { x: 9, y: 9 },
        { x: 13, y: 3 },
      ],
      player1: { x: 1, y: 1 },
      player2: { x: 11.5, y: 0 },
    },
  },
  {
    name: 'Mapa 2',
    width: 20,
    height: 16,
    tileSize: 32,
    textures: {
      floor: floorImg,
      wall: wallImg,
      breakable: breakableImg,
      enemy: enemyImg,
      player1: player1Img,
      player2: player2Img,
      rock: rockImg,
      explosion: explosionImg,
    },
    layout: {
      walls: (row, col) => row === 0 || row === 15 || col === 0 || col === 19 || (row % 3 === 0 && col % 3 === 0),
      breakables: [
        { x: 4, y: 4 },
        { x: 8, y: 8 },
        { x: 12, y: 6 },
        { x: 16, y: 10 },
        { x: 10, y: 14 },
      ],
      enemies: [
        { x: 6, y: 6 },
        { x: 10, y: 10 },
        { x: 14, y: 4 },
      ],
      player1: { x: 1, y: 1 },
      player2: { x: 18, y: 1 },
    },
  },
  {
    name: 'Mapa 3 - Grande Horizontal',
    width: 25,
    height: 15,
    tileSize: 32,
    textures: {
      floor: floorImg,
      wall: wallImg,
      breakable: breakableImg,
      enemy: enemyImg,
      player1: player1Img,
      player2: player2Img,
      rock: rockImg,
      explosion: explosionImg,
    },
    layout: {
      walls: (row, col) => row === 0 || row === 14 || col === 0 || col === 24 || (row % 2 === 0 && col % 2 === 0),
      breakables: [
        { x: 3, y: 3 },
        { x: 7, y: 5 },
        { x: 11, y: 7 },
        { x: 15, y: 9 },
        { x: 19, y: 11 },
        { x: 21, y: 3 },
        { x: 13, y: 13 },
      ],
      enemies: [
        { x: 5, y: 5 },
        { x: 12, y: 8 },
        { x: 18, y: 4 },
        { x: 22, y: 10 },
      ],
      player1: { x: 1, y: 1 },
      player2: { x: 23, y: 1 },
    },
  },
];

// Function to get a map by index
export const getMap = (index = 0) => {
  return maps[index] || maps[0]; // Default to first map if index is invalid
};