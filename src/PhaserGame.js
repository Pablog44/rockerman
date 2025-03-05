import React, { useRef, useEffect } from 'react';
import Phaser from 'phaser';

function PhaserGame() {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 480, // 15 columnas * 32px
      height: 416, // 13 filas * 32px
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false, // Cambia a true si quieres depurar
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    const game = new Phaser.Game(config);

    function preload() {
      // --- Jugador ---
      let playerGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      playerGraphics.fillStyle(0x00ff00, 1);
      playerGraphics.fillRect(0, 0, 24, 24);
      playerGraphics.lineStyle(2, 0xffffff, 1);
      playerGraphics.beginPath();
      playerGraphics.moveTo(12, 12);
      playerGraphics.lineTo(24, 12);
      playerGraphics.strokePath();
      playerGraphics.generateTexture('player', 24, 24);

      // --- Pared ---
      let wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      wallGraphics.fillStyle(0x888888, 1);
      wallGraphics.fillRect(0, 0, 32, 32);
      wallGraphics.generateTexture('wall', 32, 32);

      // --- Roca ---
      let rockGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      rockGraphics.fillStyle(0x964B00, 1);
      rockGraphics.fillCircle(10, 10, 10);
      rockGraphics.generateTexture('rock', 20, 20);

      // --- Partículas de explosión ---
      let explosionGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      explosionGraphics.fillStyle(0xffd700, 1);
      explosionGraphics.fillRect(0, 0, 6, 6);
      explosionGraphics.generateTexture('explosion', 6, 6);
    }

    function create() {
      const tileSize = 32;
      const rows = 13;
      const cols = 15;

      // Grupo de paredes (estáticas)
      this.walls = this.physics.add.staticGroup();

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (
            row === 0 ||
            row === rows - 1 ||
            col === 0 ||
            col === cols - 1 ||
            (row % 2 === 0 && col % 2 === 0)
          ) {
            this.walls.create(
              col * tileSize + tileSize / 2,
              row * tileSize + tileSize / 2,
              'wall'
            );
          }
        }
      }

      // Crear el jugador en la celda (1,1)
      this.player = this.physics.add.sprite(
        tileSize + tileSize / 2,
        tileSize + tileSize / 2,
        'player'
      );
      this.player.setCollideWorldBounds(true);
      this.physics.add.collider(this.player, this.walls);

      // Configurar controles
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      // Grupo para las rocas lanzadas
      this.rocks = this.physics.add.group({
        defaultKey: 'rock',
        collideWorldBounds: true,
      });

      // Función para generar la explosión de la roca
      this.explodeRock = (rock) => {
        if (!rock.active) return; // Evitar explosiones duplicadas
        const numParticles = 8;
        for (let i = 0; i < numParticles; i++) {
          let angle = Phaser.Math.DegToRad(i * (360 / numParticles));
          let particle = this.physics.add.sprite(rock.x, rock.y, 'explosion');
          this.tweens.add({
            targets: particle,
            x: particle.x + 18 * Math.cos(angle),
            y: particle.y + 18 * Math.sin(angle),
            duration: 200,
            onComplete: () => {
              particle.destroy();
            },
          });
        }
        rock.destroy(); // Destruir la roca después de explotar
      };
    }

    function update() {
      const tileSize = 32;
      const speed = 150;
      let vx = 0,
        vy = 0;

      // Movimiento del jugador
      if (this.cursors.left.isDown) {
        vx = -speed;
        this.player.setAngle(180);
      } else if (this.cursors.right.isDown) {
        vx = speed;
        this.player.setAngle(0);
      } else if (this.cursors.up.isDown) {
        vy = -speed;
        this.player.setAngle(-90);
      } else if (this.cursors.down.isDown) {
        vy = speed;
        this.player.setAngle(90);
      }

      // Corrección de alineación
      if (this.cursors.left.isDown || this.cursors.right.isDown) {
        const desiredY = Math.round((this.player.y - tileSize / 2) / tileSize) * tileSize + tileSize / 2;
        const deltaY = desiredY - this.player.y;
        const verticalCorrection = deltaY * 5;
        this.player.setVelocity(vx, verticalCorrection);
      } else if (this.cursors.up.isDown || this.cursors.down.isDown) {
        const desiredX = Math.round((this.player.x - tileSize / 2) / tileSize) * tileSize + tileSize / 2;
        const deltaX = desiredX - this.player.x;
        const horizontalCorrection = deltaX * 5;
        this.player.setVelocity(horizontalCorrection, vy);
      } else {
        this.player.setVelocity(0, 0);
      }

      // Lanzar roca al presionar espacio
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        const rockSpeed = 200; // Velocidad constante de la roca
        const angleRad = Phaser.Math.DegToRad(this.player.angle);
        const rockVx = rockSpeed * Math.cos(angleRad);
        const rockVy = rockSpeed * Math.sin(angleRad);

        // Offset para que la roca aparezca fuera del collider del jugador
        const offset = 25;
        const spawnX = this.player.x + offset * Math.cos(angleRad);
        const spawnY = this.player.y + offset * Math.sin(angleRad);

        // Crear la roca
        const rock = this.rocks.create(spawnX, spawnY, 'rock');
        rock.startX = spawnX; // Posición inicial para medir distancia
        rock.startY = spawnY;
        rock.setVelocity(rockVx, rockVy); // Asignar velocidad constante
        rock.body.setAllowGravity(false); // Desactivar gravedad
        rock.body.setBounce(0); // Sin rebote para evitar que se atasque

        // Evitar colisión con el jugador
        this.physics.add.collider(rock, this.player, null, () => false, this);

        // Colisión con paredes: explota al instante
        this.physics.add.collider(rock, this.walls, () => {
          this.explodeRock(rock);
        });
      }

      // Verificar distancia recorrida por las rocas
      this.rocks.getChildren().forEach((rock) => {
        if (rock.active) {
          const distance = Phaser.Math.Distance.Between(rock.startX, rock.startY, rock.x, rock.y);
          if (distance >= 80) { // Explota después de 80 píxeles
            this.explodeRock(rock);
          }
        }
      });
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameRef} />;
}

export default PhaserGame;