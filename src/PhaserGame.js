import React, { useRef, useEffect, useState } from 'react';
import Phaser from 'phaser';

// Importar imágenes directamente
import floorImg from './assets/floor.png';
import wallImg from './assets/wall.png';
import breakableImg from './assets/breakable.png';
import enemyImg from './assets/enemy.png';
import player1Img from './assets/player1.png';
import player2Img from './assets/player2.png';
import rockImg from './assets/rock.png';
import explosionImg from './assets/explosion.png';

// Mapas definidos como objetos
const maps = [
  {
    name: 'Mapa 1',
    width: 15,
    height: 13,
    tileSize: 32,
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
      player2: { x: 13, y: 1 },
    },
  },
  {
    name: 'Mapa 2',
    width: 20,
    height: 16,
    tileSize: 32,
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
];

function PhaserGame() {
  const gameRef = useRef(null);
  const gameInstance = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);

  useEffect(() => {
    if (gameInstance.current) {
      gameInstance.current.destroy(true);
      gameInstance.current = null;
    }

    const currentMap = maps[currentMapIndex];
    const tileSize = currentMap.tileSize; // 32 píxeles
    const config = {
      type: Phaser.AUTO,
      width: currentMap.width * tileSize,
      height: currentMap.height * tileSize,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: currentMap.width * tileSize,
        height: currentMap.height * tileSize,
      },
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: true }, // Debug activado
      },
      audio: { disableWebAudio: true },
      input: { gamepad: true },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    gameInstance.current = new Phaser.Game(config);

    function preload() {
      console.log('Preload ejecutado');
      this.load.image('floor', floorImg);
      this.load.image('wall', wallImg);
      this.load.image('breakable', breakableImg);
      this.load.image('enemy', enemyImg);
      this.load.image('player1', player1Img);
      this.load.image('player2', player2Img);
      this.load.image('rock', rockImg);
      this.load.image('explosion', explosionImg);

      this.load.on('complete', () => console.log('Carga de texturas completada'));
      this.load.on('filecomplete', (key) => console.log(`Archivo cargado: ${key}`));
      this.load.on('loaderror', (file) => console.error(`Error al cargar: ${file.key}`));
    }

    function create() {
      console.log('Create ejecutado');
      const tileSize = currentMap.tileSize;
      this.cameras.main.setBackgroundColor('#000000');

      // Fondo de suelo
      for (let row = 0; row < currentMap.height; row++) {
        for (let col = 0; col < currentMap.width; col++) {
          const floor = this.add.image(
            col * tileSize + tileSize / 2,
            row * tileSize + tileSize / 2,
            'floor'
          );
          floor.setScale(tileSize / floor.width);
        }
      }
      console.log('Suelo creado');

      // Paredes
      this.walls = this.physics.add.staticGroup();
      for (let row = 0; row < currentMap.height; row++) {
        for (let col = 0; col < currentMap.width; col++) {
          if (currentMap.layout.walls(row, col)) {
            const wall = this.walls.create(
              col * tileSize + tileSize / 2,
              row * tileSize + tileSize / 2,
              'wall'
            );
            wall.setScale(tileSize / wall.width); // Escalado visual
            wall.body.setSize(32, 32); // Colider fijo: 32x32 píxeles
            wall.body.updateFromGameObject(); // Sincronizar posición del colider
            wall.body.immovable = true;
          }
        }
      }
      console.log('Paredes creadas');

      // Obstáculos destructibles
      this.breakables = this.physics.add.staticGroup();
      currentMap.layout.breakables.forEach((pos) => {
        const breakable = this.breakables.create(
          pos.x * tileSize + tileSize / 2,
          pos.y * tileSize + tileSize / 2,
          'breakable'
        );
        breakable.setScale(tileSize / breakable.width); // Escalado visual
        breakable.body.setSize(32, 32); // Colider fijo: 32x32 píxeles
        breakable.body.updateFromGameObject(); // Sincronizar posición del colider
        breakable.body.immovable = true;
        breakable.hits = 0;
      });
      console.log('Obstáculos destructibles creados');

      // Jugador 1
      this.player1 = this.physics.add.sprite(
        currentMap.layout.player1.x * tileSize + tileSize / 2,
        currentMap.layout.player1.y * tileSize + tileSize / 2,
        'player1'
      );
      this.player1.setScale(tileSize / this.player1.width * 0.75); // Escalado visual
      this.player1.body.setSize(24, 24); // Colider fijo: 24x24 píxeles
      this.player1.body.updateFromGameObject(); // Sincronizar posición del colider
      this.player1.setCollideWorldBounds(true);
      this.physics.add.collider(this.player1, this.walls);
      this.physics.add.collider(this.player1, this.breakables);
      this.player1.lastDirection = 'right';
      console.log('Jugador 1 creado');

      this.player2 = null;

      // Enemigos
      this.enemies = this.physics.add.group();
      currentMap.layout.enemies.forEach((pos) => {
        const enemy = this.enemies.create(
          pos.x * tileSize + tileSize / 2,
          pos.y * tileSize + tileSize / 2,
          'enemy'
        );
        enemy.setScale(tileSize / enemy.width * 0.75); // Escalado visual
        enemy.body.setSize(24, 24); // Colider fijo: 24x24 píxeles
        enemy.body.updateFromGameObject(); // Sincronizar posición del colider
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));
        enemy.setBounce(1);
        this.physics.add.collider(enemy, this.walls);
        this.physics.add.collider(enemy, this.breakables);
      });
      console.log('Enemigos creados');

      // Controles
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keysPlayer2 = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        fire: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      };

      // Rocas
      this.rocks = this.physics.add.group({ defaultKey: 'rock', collideWorldBounds: true });

      // Funciones
      this.explodeRock = (rock) => {
        if (!rock.active) return;
        const numParticles = 8;
        for (let i = 0; i < numParticles; i++) {
          let angle = Phaser.Math.DegToRad(i * (360 / numParticles));
          const particle = this.physics.add.sprite(rock.x, rock.y, 'explosion');
          particle.setScale(tileSize / particle.width * 0.2);
          this.tweens.add({
            targets: particle,
            x: particle.x + 18 * Math.cos(angle),
            y: particle.y + 18 * Math.sin(angle),
            duration: 200,
            onComplete: () => particle.destroy(),
          });
        }
        rock.destroy();
      };

      this.launchRock = (player) => {
        const rockSpeed = 200;
        let rockVx = 0,
          rockVy = 0;
        let angleRad = 0;

        switch (player.lastDirection) {
          case 'left':
            rockVx = -rockSpeed;
            angleRad = Phaser.Math.DegToRad(180);
            break;
          case 'right':
            rockVx = rockSpeed;
            angleRad = Phaser.Math.DegToRad(0);
            break;
          case 'up':
            rockVy = -rockSpeed;
            angleRad = Phaser.Math.DegToRad(-90);
            break;
          case 'down':
            rockVy = rockSpeed;
            angleRad = Phaser.Math.DegToRad(90);
            break;
          default:
            rockVx = rockSpeed;
            angleRad = Phaser.Math.DegToRad(0);
            break;
        }

        const offset = tileSize * 0.75;
        const spawnX = player.x + offset * Math.cos(angleRad);
        const spawnY = player.y + offset * Math.sin(angleRad);

        const rock = this.rocks.create(spawnX, spawnY, 'rock');
        rock.setScale(tileSize / rock.width * 0.5); // Escalado visual
        rock.body.setSize(16, 16); // Colider fijo: 16x16 píxeles
        rock.body.updateFromGameObject(); // Sincronizar posición del colider
        rock.startX = spawnX;
        rock.startY = spawnY;
        rock.setVelocity(rockVx, rockVy);
        rock.setAngle(Phaser.Math.RadToDeg(angleRad));
        rock.body.setAllowGravity(false);
        rock.body.setBounce(0);

        this.physics.add.collider(rock, player, null, () => false, this);
        this.physics.add.collider(rock, this.walls, () => this.explodeRock(rock));
        this.physics.add.collider(rock, this.breakables, (rock, breakable) => {
          breakable.hits += 1;
          this.explodeRock(rock);
          if (breakable.hits >= 2) breakable.destroy();
        });
        this.physics.add.collider(rock, this.enemies, (rock, enemy) => {
          this.explodeRock(rock);
          enemy.destroy();
        });
        if (player === this.player1 && this.player2) {
          this.physics.add.collider(rock, this.player2, () => {
            this.explodeRock(rock);
            this.player2.destroy();
            this.player2 = null;
            if (!this.player1) setGameOver(true);
          });
        } else if (player === this.player2 && this.player1) {
          this.physics.add.collider(rock, this.player1, () => {
            this.explodeRock(rock);
            this.player1.destroy();
            this.player1 = null;
            if (!this.player2) setGameOver(true);
          });
        }
      };

      this.physics.add.collider(this.player1, this.enemies, () => {
        this.player1.destroy();
        this.player1 = null;
        if (!this.player2) setGameOver(true);
      });
      this.physics.add.collider(this.enemies, this.enemies);
    }

    function update() {
      if (gameOver) return;

      const tileSize = currentMap.tileSize;
      const speed = 150;
      const gamepad = this.input.gamepad;
      const pad1 = gamepad && gamepad.pad1;
      const pad2 = gamepad && gamepad.pad2;

      // --- Jugador 1 ---
      let vx1 = 0,
        vy1 = 0;
      if (pad1 && this.player1) {
        const axisH = pad1.axes[0].getValue();
        const axisV = pad1.axes[1].getValue();
        if (axisH < -0.2) {
          vx1 = -speed;
          this.player1.lastDirection = 'left';
        } else if (axisH > 0.2) {
          vx1 = speed;
          this.player1.lastDirection = 'right';
        }
        if (axisV < -0.2) {
          vy1 = -speed;
          this.player1.lastDirection = 'up';
        } else if (axisV > 0.2) {
          vy1 = speed;
          this.player1.lastDirection = 'down';
        }
        if (pad1.buttons[0].pressed && !this.pad1AFired) {
          this.launchRock(this.player1);
          this.pad1AFired = true;
        } else if (!pad1.buttons[0].pressed) {
          this.pad1AFired = false;
        }
      } else if (this.player1) {
        if (this.cursors.left.isDown) {
          vx1 = -speed;
          this.player1.lastDirection = 'left';
        } else if (this.cursors.right.isDown) {
          vx1 = speed;
          this.player1.lastDirection = 'right';
        }
        if (this.cursors.up.isDown) {
          vy1 = -speed;
          this.player1.lastDirection = 'up';
        } else if (this.cursors.down.isDown) {
          vy1 = speed;
          this.player1.lastDirection = 'down';
        }
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
          this.launchRock(this.player1);
        }
      }

      if (this.player1) {
        this.player1.setVelocityX(vx1);
        this.player1.setVelocityY(vy1);
      }

      // --- Jugador 2 ---
      let vx2 = 0,
        vy2 = 0;
      if (pad2 && !this.player2 && pad2.buttons[9].pressed && !this.pad2StartFired) {
        this.player2 = this.physics.add.sprite(
          currentMap.layout.player2.x * tileSize + tileSize / 2,
          currentMap.layout.player2.y * tileSize + tileSize / 2,
          'player2'
        );
        this.player2.setScale(tileSize / this.player2.width * 0.75);
        this.player2.body.setSize(24, 24); // Colider fijo: 24x24 píxeles
        this.player2.body.updateFromGameObject(); // Sincronizar posición del colider
        this.player2.setCollideWorldBounds(true);
        this.physics.add.collider(this.player2, this.walls);
        this.physics.add.collider(this.player2, this.breakables);
        this.physics.add.collider(this.player2, this.enemies, () => {
          this.player2.destroy();
          this.player2 = null;
          if (!this.player1) setGameOver(true);
        });
        if (this.player1) this.physics.add.collider(this.player1, this.player2);
        this.player2.lastDirection = 'left';
        this.pad2StartFired = true;
      } else if (pad2 && !pad2.buttons[9].pressed) {
        this.pad2StartFired = false;
      }

      if (this.player2) {
        if (pad2) {
          const axisH = pad2.axes[0].getValue();
          const axisV = pad2.axes[1].getValue();
          if (axisH < -0.2) {
            vx2 = -speed;
            this.player2.lastDirection = 'left';
          } else if (axisH > 0.2) {
            vx2 = speed;
            this.player2.lastDirection = 'right';
          }
          if (axisV < -0.2) {
            vy2 = -speed;
            this.player2.lastDirection = 'up';
          } else if (axisV > 0.2) {
            vy2 = speed;
            this.player2.lastDirection = 'down';
          }
          if (pad2.buttons[0].pressed && !this.pad2AFired) {
            this.launchRock(this.player2);
            this.pad2AFired = true;
          } else if (!pad2.buttons[0].pressed) {
            this.pad2AFired = false;
          }
        } else {
          if (this.keysPlayer2.left.isDown) {
            vx2 = -speed;
            this.player2.lastDirection = 'left';
          } else if (this.keysPlayer2.right.isDown) {
            vx2 = speed;
            this.player2.lastDirection = 'right';
          }
          if (this.keysPlayer2.up.isDown) {
            vy2 = -speed;
            this.player2.lastDirection = 'up';
          } else if (this.keysPlayer2.down.isDown) {
            vy2 = speed;
            this.player2.lastDirection = 'down';
          }
          if (Phaser.Input.Keyboard.JustDown(this.keysPlayer2.fire)) {
            this.launchRock(this.player2);
          }
        }

        this.player2.setVelocityX(vx2);
        this.player2.setVelocityY(vy2);
      }

      // Verificar distancia recorrida por las rocas
      this.rocks.getChildren().forEach((rock) => {
        if (rock.active) {
          const distance = Phaser.Math.Distance.Between(rock.startX, rock.startY, rock.x, rock.y);
          if (distance >= tileSize * 2.5) this.explodeRock(rock);
        }
      });
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [currentMapIndex, gameOver]);

  const handleRestart = () => {
    setGameOver(false);
    setCurrentMapIndex((prev) => (prev + 1) % maps.length);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000',
      }}
    >
      <div
        ref={gameRef}
        style={{
          width: `${window.innerWidth * 0.8}px`,
          height: `${window.innerHeight * 0.8}px`,
          border: '1px solid red',
          position: 'relative',
        }}
      >
        {gameOver && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <h1 style={{ fontSize: '48px', margin: '20px' }}>Game Over</h1>
            <button
              onClick={handleRestart}
              style={{
                padding: '10px 20px',
                fontSize: '24px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Reiniciar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhaserGame;