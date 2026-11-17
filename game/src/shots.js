// Automated screenshot staged scenes (?shot=start|play|end)
import { STEP } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

export function stageShot(name, world) {
  world.reset();
  const s = world.state;

  if (name === 'start') {
    // A few initial steps to settle stars
    for (let i = 0; i < 60; i++) world.step(STEP, { up: false, left: false, right: false, fire: false }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'end') {
    // Simulate game over state with nice score
    s.score = 4850;
    s.wave = 4;
    s.lives = 0;
    s.over = true;
    world.addParticles(s.ship.x, s.ship.y, '#ff0055', 40, 2);
    for (let i = 0; i < 30; i++) world.step(STEP, { up: false, left: false, right: false, fire: false }, true);
    return { screen: SCREEN_OVER, best: 4850 };
  }

  // Play scene: active combat with lasers, asteroids, enemies and powerups
  s.score = 2640;
  s.wave = 3;
  s.multiplier = 3;
  s.multiplierTimer = 3.2;
  s.ship.x = 420;
  s.ship.y = 300;
  s.ship.angle = -Math.PI / 4;
  s.ship.powerup = 'rapid';
  s.ship.powerupTime = 5.4;

  // Add active lasers
  s.lasers.push({ x: 450, y: 270, vx: 500, vy: -500, life: 0.8 });
  s.lasers.push({ x: 480, y: 240, vx: 500, vy: -500, life: 0.9 });

  // Add enemy
  s.enemies.push({ x: 750, y: 160, vx: -60, vy: 40, fireTimer: 1.2 });
  s.enemyLasers.push({ x: 700, y: 180, vx: -200, vy: 100, life: 1.5 });

  // Add powerup
  s.powerups.push({ x: 300, y: 220, type: 'spread', life: 8.0 });

  // Add particles
  world.addParticles(620, 180, '#ff00bb', 25);
  world.addParticles(400, 320, '#00ffff', 15);

  return { screen: SCREEN_PLAY, best: 2640 };
}
