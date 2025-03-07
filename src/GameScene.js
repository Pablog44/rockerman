// GameScene.js
import Phaser from 'phaser';

export const createGameScene = (currentMap, setGameOver) => {
  return {
    preload() {
      console.log('Preload ejecutado');
      this.load.image('floor', currentMap.textures.floor);
      this.load.image('wall', currentMap.textures.wall);
      this.load.image('breakable', currentMap.textures.breakable);
      this.load.image('enemy', currentMap.textures.enemy);
      this.load.image('player1', currentMap.textures.player1);
      this.load.image('player2', currentMap.textures.player2);
      this.load.image('rock', currentMap.textures.rock);
      this.load.image('explosion', currentMap.textures.explosion);

      this.load.on('complete', () => console.log('Carga de texturas completada'));
      this.load.on('filecomplete', (key) => console.log(`Archivo cargado: ${key}`));
      this.load.on('loaderror', (file) => console.error(`Error al cargar: ${file.key}`));
    },

    create() {
      console.log('Create ejecutado');
      this.cameras.main.setBackgroundColor('#000000');
      const tileSize = currentMap.tileSize;

      // Fondo de suelo
      for (let row = 0; row < currentMap.height; row++) {
        for (let col = 0; col < currentMap.width; col++) {
          const floor = this.add.image(col * tileSize + tileSize / 2, row * tileSize + tileSize / 2, 'floor');
          floor.setScale(tileSize / floor.width);
        }
      }
      console.log('Suelo creado');

      // Paredes
      this.walls = this.physics.add.staticGroup();
      for (let row = 0; row < currentMap.height; row++) {
        for (let col = 0; col < currentMap.width; col++) {
          if (currentMap.layout.walls(row, col)) {
            const wall = this.walls.create(col * tileSize + tileSize / 2, row * tileSize + tileSize / 2, 'wall');
            wall.setScale(tileSize / wall.width);
            wall.body.setSize(32, 32);
            wall.body.updateFromGameObject();
            wall.body.immovable = true;
          }
        }
      }
      console.log('Paredes creadas');

      // Obstáculos destructibles
      this.breakables = this.physics.add.staticGroup();
      currentMap.layout.breakables.forEach((pos) => {
        const breakable = this.breakables.create(pos.x * tileSize + tileSize / 2, pos.y * tileSize + tileSize / 2, 'breakable');
        breakable.setScale(tileSize / breakable.width);
        breakable.body.setSize(32, 32);
        breakable.body.updateFromGameObject();
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
      this.player1.setScale(tileSize / this.player1.width * 0.9);
      this.player1.body.setSize(100, 100);
      this.player1.body.updateFromGameObject();
      this.player1.setCollideWorldBounds(true);
      this.physics.add.collider(this.player1, this.walls);
      this.physics.add.collider(this.player1, this.breakables);
      this.player1.lastDirection = 'right';
      console.log('Jugador 1 - Sprite en:', this.player1.x, this.player1.y);

      this.player2 = null;

      // Enemigos
      this.enemies = this.physics.add.group();
      currentMap.layout.enemies.forEach((pos) => {
        const enemy = this.enemies.create(pos.x * tileSize + tileSize / 2, pos.y * tileSize + tileSize / 2, 'enemy');
        enemy.setScale(tileSize / enemy.width * 0.75);
        enemy.body.setSize(700, 700);
        enemy.body.updateFromGameObject();
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
        console.log('Roca explotando en:', rock.x, rock.y);
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
        let spawnX = player.x;
        let spawnY = player.y;

        switch (player.lastDirection) {
          case 'left':
            rockVx = -rockSpeed;
            break;
          case 'right':
            rockVx = rockSpeed;
            break;
          case 'up':
            rockVy = -rockSpeed;
            break;
          case 'down':
            rockVy = rockSpeed;
            break;
          default:
            rockVx = rockSpeed;
            break;
        }

        console.log('Lanzando roca desde:', spawnX, spawnY, 'en dirección:', player.lastDirection);

        const rock = this.rocks.create(spawnX, spawnY, 'rock');
        rock.setOrigin(0.5, 0.5);
        rock.setScale(tileSize / rock.width * 0.5);
        rock.body.setSize(200, 200);
        rock.body.reset(spawnX, spawnY);
        rock.startX = spawnX;
        rock.startY = spawnY;
        rock.setVelocity(rockVx, rockVy);
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
    },

    update() {
      if (setGameOver().gameOver) return;

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
        this.player2.setScale(tileSize / this.player2.width * 0.9);
        this.player2.body.setSize(100, 100);
        this.player2.body.updateFromGameObject();
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

      this.rocks.getChildren().forEach((rock) => {
        if (rock.active) {
          const distance = Phaser.Math.Distance.Between(rock.startX, rock.startY, rock.x, rock.y);
          if (distance >= 80) {
            this.explodeRock(rock);
          }
        }
      });
    },
  };
};