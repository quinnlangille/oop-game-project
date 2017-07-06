// This sectin contains some game constants. It is not super interesting
var GAME_WIDTH = 375;
var GAME_HEIGHT = 500;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 3;

var BOSS_WIDTH = 300;
var BOSS_HEIGHT = 400; //figure out after

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 75;

// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var UP_ARROW_CODE = 38;
var DOWN_ARROW_CODE = 40;
var SPACE_BAR_CODE = 32;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';
var MOVE_DOWN = 'down';
var MOVE_UP = 'up';

// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png', 'ziad.png', 'kevin.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});

class Entity {
  render(ctx) {
      ctx.drawImage(this.sprite, this.x, this.y);
  }
}

// This section is where you will be doing most of your coding
class Enemy extends Entity {
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }
}

class Player extends Entity{
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['ziad.png'];
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
        else if (direction === MOVE_DOWN && this.y < GAME_HEIGHT - PLAYER_HEIGHT - 20) {
            this.y = this.y + PLAYER_HEIGHT;
        }
        else if (direction === MOVE_UP && this.y > 0 + PLAYER_HEIGHT / 3) {
            this.y = this.y - PLAYER_HEIGHT;
        }
    }
}

class Boss extends Enemy {
  constructor() {
      super();
      this.x = 0;
      this.y = -BOSS_HEIGHT;
      this.sprite = images['kevin.png'];

      // Each enemy should have a different speed
      this.speed = 0.2;
  }

  update(timeDiff) {
      this.y = this.y + timeDiff * this.speed;
  }
}

/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/

class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();

        this.boss = new Boss();
        // Setup enemies, making sure there are always three

        this.setupEnemies();

        // Setup Boss once checkpoint is reached
        // this.deployBoss();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
            }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (!enemySpots || this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

          if(isBossTime()) {
             this.enemies = [];
          }
          this.enemies[enemySpot] = new Enemy(Math.floor(enemySpot * ENEMY_WIDTH));
      }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();

        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
            else if (e.keyCode === UP_ARROW_CODE) {
                this.player.move(MOVE_UP);
                console.log("Limit is " + (GAME_HEIGHT - PLAYER_HEIGHT));
                console.log("Player coordinates are " + this.player.y);
            }
            else if (e.keyCode === DOWN_ARROW_CODE) {
                this.player.move(MOVE_DOWN);
                console.log("limit is " + (GAME_HEIGHT - PLAYER_HEIGHT));
                console.log("Player coordinates are " + this.player.y);
            }
            else if (e.keyCode === SPACE_BAR_CODE) {
               this.shoot();
               console.log("U pressed it")
            }
        });

        this.gameLoop();
    }

    // deployBoss() {
    //     console.log("Inside the Boss fucnction" + this.score);
    //     this.boss = new Boss;
    //     if(this.score === 2000) {
    //         console.log("Inside the condition" + this.score);
    //         this.boss = new Boss();
    //         while(Boss) {
    //             console.log("Inside the while" + this.score);
    //         }
    //     }
    // }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += 1;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player
        this.boss.render(this.ctx);

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            if (enemy.y > GAME_HEIGHT) {
                delete this.enemies[enemyIdx];
            }
        });

        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + ' GAME OVER', 5, 30);
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 5, 30);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }

        if(this.isBossTime(timeDiff)) {
          console.log("IT IS BOSS TIME");
        }
    }

    isBossTime(timeDiff) {
      if(this.score >= 200) {
          console.log("THE BOSS HAS ARRIVED", timeDiff)
          this.boss.update(timeDiff);
          return true;
        }
        return false
      }

    isPlayerDead() {
        var dead = false;
        var hitZone = (PLAYER_HEIGHT - this.player.y);
        console.log(hitZone);
        this.enemies.forEach((enemy, i) => {
            if (this.enemies[i]
                && this.enemies[i].x < this.player.x + PLAYER_WIDTH - 0.2 * PLAYER_WIDTH
                && this.enemies[i].x + ENEMY_WIDTH > this.player.x + 0.2 * PLAYER_WIDTH
                && this.enemies[i].y + ENEMY_HEIGHT* 0.6 > this.player.y
                && this.enemies[i].y + ENEMY_HEIGHT* 0.5 < this.player.y + PLAYER_HEIGHT) {

                dead = true;
                console.log(hitZone);
                return;
              }
        });

        return dead;
    }
}



// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();
