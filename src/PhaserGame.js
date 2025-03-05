import React, { useRef, useEffect } from 'react';
import Phaser from 'phaser';

function PhaserGame() {
  const gameRef = useRef(null);
  const gameInstance = useRef(null);

  useEffect(() => {
    if (gameInstance.current) return;

    const config = {
      type: Phaser.AUTO,
      width: 480,
      height: 416,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: true, // Activado para depurar colisiones
        },
      },
      audio: {
        disableWebAudio: true,
      },
      input: {
        gamepad: true, // Habilitar soporte para gamepads explícitamente
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    gameInstance.current = new Phaser.Game(config);

    function preload() {
      console.log('Preload ejecutado');
      let player1Graphics = this.make.graphics({ x: 0, y: 0, add: false });
      player1Graphics.fillStyle(0x00ff00, 1);
      player1Graphics.fillRect(0, 0, 24, 24);
      player1Graphics.lineStyle(2, 0xffffff, 1);
      player1Graphics.beginPath();
      player1Graphics.moveTo(12, 12);
      player1Graphics.lineTo(24, 12);
      player1Graphics.strokePath();
      player1Graphics.generateTexture('player1', 24, 24);

      let player2Graphics = this.make.graphics({ x: 0, y: 0, add: false });
      player2Graphics.fillStyle(0xff0000, 1);
      player2Graphics.fillRect(0, 0, 24, 24);
      player2Graphics.lineStyle(2, 0xffffff, 1);
      player2Graphics.beginPath();
      player2Graphics.moveTo(12, 12);
      player2Graphics.lineTo(24, 12);
      player2Graphics.strokePath();
      player2Graphics.generateTexture('player2', 24, 24);

      let wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      wallGraphics.fillStyle(0x888888, 1);
      wallGraphics.fillRect(0, 0, 32, 32);
      wallGraphics.generateTexture('wall', 32, 32);

      let rockGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      rockGraphics.fillStyle(0x964B00, 1);
      rockGraphics.fillCircle(10, 10, 10);
      rockGraphics.generateTexture('rock', 20, 20);

      let explosionGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      explosionGraphics.fillStyle(0xffd700, 1);
      explosionGraphics.fillRect(0, 0, 6, 6);
      explosionGraphics.generateTexture('explosion', 6, 6);
    }

    function create() {
      console.log('Create ejecutado');
      const tileSize = 32;
      const rows = 13;
      const cols = 15;

      this.cameras.main.setBackgroundColor('#000000');
      console.log('Cámara configurada');

      this.walls = this.physics.add.staticGroup();
      console.log('Grupo de paredes creado');

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
      console.log('Paredes creadas');

      this.player1 = this.physics.add.sprite(
        tileSize + tileSize / 2,
        tileSize + tileSize / 2,
        'player1'
      );
      this.player1.setCollideWorldBounds(true);
      this.physics.add.collider(this.player1, this.walls);
      console.log('Jugador 1 creado');

      this.player2 = null;

      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      this.keysPlayer2 = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        fire: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      };

      this.rocks = this.physics.add.group({
        defaultKey: 'rock',
        collideWorldBounds: true,
      });
      console.log('Grupo de rocas creado');

      this.explodeRock = (rock) => {
        if (!rock.active) return;
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
        rock.destroy();
      };

      this.launchRock = (player) => {
        const rockSpeed = 200;
        const angleRad = Phaser.Math.DegToRad(player.angle);
        const rockVx = rockSpeed * Math.cos(angleRad);
        const rockVy = rockSpeed * Math.sin(angleRad);

        const offset = 25;
        const spawnX = player.x + offset * Math.cos(angleRad);
        const spawnY = player.y + offset * Math.sin(angleRad);

        const rock = this.rocks.create(spawnX, spawnY, 'rock');
        rock.startX = spawnX;
        rock.startY = spawnY;
        rock.setVelocity(rockVx, rockVy);
        rock.body.setAllowGravity(false);
        rock.body.setBounce(0);

        this.physics.add.collider(rock, player, null, () => false, this);
        this.physics.add.collider(rock, this.walls, () => {
          this.explodeRock(rock);
        });
        if (player === this.player1 && this.player2) {
          this.physics.add.collider(rock, this.player2, () => {
            this.explodeRock(rock);
            this.player2.destroy();
            this.player2 = null;
          });
        } else if (player === this.player2 && this.player1) {
          this.physics.add.collider(rock, this.player1, () => {
            this.explodeRock(rock);
            this.player1.destroy();
            this.player1 = null;
          });
        }
      };
    }

    function update() {
      const tileSize = 32;
      const speed = 150;

      // Verificar si gamepad está disponible
      const gamepad = this.input.gamepad;
      const pad1 = gamepad && gamepad.pad1;
      const pad2 = gamepad && gamepad.pad2;

      // --- Jugador 1 ---
      let vx1 = 0,
        vy1 = 0;
      if (pad1) {
        const axisH = pad1.axes[0].getValue();
        const axisV = pad1.axes[1].getValue();
        if (axisH < -0.2) {
          vx1 = -speed;
          this.player1.setAngle(180);
        } else if (axisH > 0.2) {
          vx1 = speed;
          this.player1.setAngle(0);
        }
        if (axisV < -0.2) {
          vy1 = -speed;
          this.player1.setAngle(-90);
        } else if (axisV > 0.2) {
          vy1 = speed;
          this.player1.setAngle(90);
        }
        if (pad1.buttons[0].pressed && !this.pad1AFired) {
          this.launchRock(this.player1);
          this.pad1AFired = true;
        } else if (!pad1.buttons[0].pressed) {
          this.pad1AFired = false;
        }
      } else {
        if (this.cursors.left.isDown) {
          vx1 = -speed;
          this.player1.setAngle(180);
        } else if (this.cursors.right.isDown) {
          vx1 = speed;
          this.player1.setAngle(0);
        }
        if (this.cursors.up.isDown) {
          vy1 = -speed;
          this.player1.setAngle(-90);
        } else if (this.cursors.down.isDown) {
          vy1 = speed;
          this.player1.setAngle(90);
        }
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
          this.launchRock(this.player1);
        }
      }

      if (this.player1) {
        if (vx1 !== 0) {
          const desiredY = Math.round((this.player1.y - tileSize / 2) / tileSize) * tileSize + tileSize / 2;
          const deltaY = desiredY - this.player1.y;
          this.player1.setVelocity(vx1, deltaY * 5);
        } else if (vy1 !== 0) {
          const desiredX = Math.round((this.player1.x - tileSize / 2) / tileSize) * tileSize + tileSize / 2;
          const deltaX = desiredX - this.player1.x;
          this.player1.setVelocity(deltaX * 5, vy1);
        } else {
          this.player1.setVelocity(0, 0);
        }
      }

      // --- Jugador 2 ---
      let vx2 = 0,
        vy2 = 0;
      if (pad2 && !this.player2 && pad2.buttons[9].pressed && !this.pad2StartFired) {
        console.log('Jugador 2 creado');
        this.player2 = this.physics.add.sprite(
          tileSize * 13 + tileSize / 2,
          tileSize + tileSize / 2,
          'player2'
        );
        this.player2.setCollideWorldBounds(true);
        this.physics.add.collider(this.player2, this.walls);
        if (this.player1) {
          this.physics.add.collider(this.player1, this.player2);
        }
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
            this.player2.setAngle(180);
          } else if (axisH > 0.2) {
            vx2 = speed;
            this.player2.setAngle(0);
          }
          if (axisV < -0.2) {
            vy2 = -speed;
            this.player2.setAngle(-90);
          } else if (axisV > 0.2) {
            vy2 = speed;
            this.player2.setAngle(90);
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
            this.player2.setAngle(180);
          } else if (this.keysPlayer2.right.isDown) {
            vx2 = speed;
            this.player2.setAngle(0);
          }
          if (this.keysPlayer2.up.isDown) {
            vy2 = -speed;
            this.player2.setAngle(-90);
          } else if (this.keysPlayer2.down.isDown) {
            vy2 = speed;
            this.player2.setAngle(90);
          }
          if (Phaser.Input.Keyboard.JustDown(this.keysPlayer2.fire)) {
            this.launchRock(this.player2);
          }
        }

        if (vx2 !== 0) {
          const desiredY = Math.round((this.player2.y - tileSize / 2) / tileSize) * tileSize + tileSize / 2;
          const deltaY = desiredY - this.player2.y;
          this.player2.setVelocity(vx2, deltaY * 5);
        } else if (vy2 !== 0) {
          const desiredX = Math.round((this.player2.x - tileSize / 2) / tileSize) * tileSize + tileSize / 2;
          const deltaX = desiredX - this.player2.x;
          this.player2.setVelocity(deltaX * 5, vy2);
        } else {
          this.player2.setVelocity(0, 0);
        }
      }

      // Verificar distancia recorrida por las rocas
      this.rocks.getChildren().forEach((rock) => {
        if (rock.active) {
          const distance = Phaser.Math.Distance.Between(rock.startX, rock.startY, rock.x, rock.y);
          if (distance >= 80) {
            this.explodeRock(rock);
          }
        }
      });
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []);

  return <div ref={gameRef} style={{ width: '480px', height: '416px', border: '1px solid red' }} />;
}

export default PhaserGame;