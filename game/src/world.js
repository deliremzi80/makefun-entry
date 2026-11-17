// Physics, entities, and state update
import { FIELD, SHIP, LASER, ASTEROID, ENEMY, POWERUP } from './config.js';
import { playLaser, playExplosion, playPowerup, playGameOver } from './audio.js';

export const EVENT_NONE = 0;
export const EVENT_OVER = 1;
export const EVENT_SCORE = 2;

export class World {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.state = {
      ship: {
        x: FIELD.width / 2,
        y: FIELD.height / 2,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
        fireCooldown: 0,
        invulnerable: SHIP.invulnerableTime,
        powerup: null,
        powerupTime: 0,
      },
      lives: SHIP.maxLives,
      score: 0,
      wave: 1,
      multiplier: 1,
      multiplierTimer: 0,
      asteroids: [],
      lasers: [],
      enemyLasers: [],
      enemies: [],
      powerups: [],
      particles: [],
      stars: this.initStars(80),
      time: 0,
      over: false,
    };
    this.spawnWave(1);
  }

  initStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: this.rng.next() * FIELD.width,
        y: this.rng.next() * FIELD.height,
        size: 0.8 + this.rng.next() * 1.8,
        speed: 0.1 + this.rng.next() * 0.4,
        alpha: 0.3 + this.rng.next() * 0.7,
      });
    }
    return stars;
  }

  spawnWave(wave) {
    this.state.wave = wave;
    const count = 3 + wave * 2;
    for (let i = 0; i < count; i++) {
      this.spawnAsteroid(0);
    }
    if (wave >= 2) {
      this.spawnEnemy();
    }
  }

  spawnAsteroid(tier, px, py) {
    let x = px;
    let y = py;
    if (x === undefined || y === undefined) {
      // Spawn along edge
      if (this.rng.next() < 0.5) {
        x = this.rng.next() < 0.5 ? 0 : FIELD.width;
        y = this.rng.next() * FIELD.height;
      } else {
        x = this.rng.next() * FIELD.width;
        y = this.rng.next() < 0.5 ? 0 : FIELD.height;
      }
    }
    const speed = ASTEROID.tierSpeeds[tier] * (0.8 + this.rng.next() * 0.4);
    const angle = this.rng.next() * Math.PI * 2;
    this.state.asteroids.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: ASTEROID.tierRadii[tier],
      tier,
      rot: 0,
      rotSpeed: (this.rng.next() - 0.5) * 2.5,
    });
  }

  spawnEnemy() {
    const x = this.rng.next() < 0.5 ? 20 : FIELD.width - 20;
    const y = 50 + this.rng.next() * (FIELD.height - 100);
    this.state.enemies.push({
      x,
      y,
      vx: (this.rng.next() - 0.5) * ENEMY.speed,
      vy: (this.rng.next() - 0.5) * ENEMY.speed,
      fireTimer: 1.0 + this.rng.next(),
    });
  }

  addParticles(x, y, color, count = 12, speedMult = 1) {
    for (let i = 0; i < count; i++) {
      const angle = this.rng.next() * Math.PI * 2;
      const speed = (30 + this.rng.next() * 140) * speedMult;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + this.rng.next() * 0.4,
        maxLife: 0.7,
        color,
        size: 1.5 + this.rng.next() * 2.5,
      });
    }
  }

  step(dt, controls, demoMode = false) {
    if (this.state.over) return EVENT_OVER;
    let events = EVENT_NONE;
    const s = this.state;
    s.time += dt;

    // Multiplier timer
    if (s.multiplierTimer > 0) {
      s.multiplierTimer -= dt;
      if (s.multiplierTimer <= 0) s.multiplier = 1;
    }

    // Ship updates
    const ship = s.ship;
    if (ship.invulnerable > 0) ship.invulnerable -= dt;
    if (ship.powerupTime > 0) {
      ship.powerupTime -= dt;
      if (ship.powerupTime <= 0) ship.powerup = null;
    }
    if (ship.fireCooldown > 0) ship.fireCooldown -= dt;

    if (controls.left) ship.angle -= SHIP.rotateSpeed * dt;
    if (controls.right) ship.angle += SHIP.rotateSpeed * dt;

    if (controls.up) {
      ship.vx += Math.cos(ship.angle) * SHIP.thrust * dt;
      ship.vy += Math.sin(ship.angle) * SHIP.thrust * dt;
      // Thrust particles
      const ex = ship.x - Math.cos(ship.angle) * 14;
      const ey = ship.y - Math.sin(ship.angle) * 14;
      s.particles.push({
        x: ex,
        y: ey,
        vx: -Math.cos(ship.angle) * 60 + (this.rng.next() - 0.5) * 40,
        vy: -Math.sin(ship.angle) * 60 + (this.rng.next() - 0.5) * 40,
        life: 0.15,
        maxLife: 0.15,
        color: '#00ffff',
        size: 2,
      });
    }

    ship.vx *= Math.pow(SHIP.friction, dt * 60);
    ship.vy *= Math.pow(SHIP.friction, dt * 60);
    ship.x = (ship.x + ship.vx * dt + FIELD.width) % FIELD.width;
    ship.y = (ship.y + ship.vy * dt + FIELD.height) % FIELD.height;

    // Fire weapon
    if (controls.fire && ship.fireCooldown <= 0) {
      const rate = ship.powerup === 'rapid' ? SHIP.fireRate * 0.45 : SHIP.fireRate;
      ship.fireCooldown = rate;
      if (!demoMode) playLaser();

      if (ship.powerup === 'spread') {
        [-0.22, 0, 0.22].forEach((spread) => {
          const a = ship.angle + spread;
          s.lasers.push({
            x: ship.x + Math.cos(a) * 16,
            y: ship.y + Math.sin(a) * 16,
            vx: Math.cos(a) * LASER.speed,
            vy: Math.sin(a) * LASER.speed,
            life: LASER.life,
          });
        });
      } else {
        s.lasers.push({
          x: ship.x + Math.cos(ship.angle) * 16,
          y: ship.y + Math.sin(ship.angle) * 16,
          vx: Math.cos(ship.angle) * LASER.speed,
          vy: Math.sin(ship.angle) * LASER.speed,
          life: LASER.life,
        });
      }
    }

    // Update lasers
    for (let i = s.lasers.length - 1; i >= 0; i--) {
      const l = s.lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.life -= dt;
      if (l.life <= 0 || l.x < 0 || l.x > FIELD.width || l.y < 0 || l.y > FIELD.height) {
        s.lasers.splice(i, 1);
      }
    }

    // Update enemy lasers
    for (let i = s.enemyLasers.length - 1; i >= 0; i--) {
      const el = s.enemyLasers[i];
      el.x += el.vx * dt;
      el.y += el.vy * dt;
      el.life -= dt;
      // Hit player
      if (ship.invulnerable <= 0 && Math.hypot(el.x - ship.x, el.y - ship.y) < SHIP.radius + 4) {
        s.enemyLasers.splice(i, 1);
        this.hitShip(demoMode);
        continue;
      }
      if (el.life <= 0 || el.x < 0 || el.x > FIELD.width || el.y < 0 || el.y > FIELD.height) {
        s.enemyLasers.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const en = s.enemies[i];
      en.x += en.vx * dt;
      en.y += en.vy * dt;
      if (en.x < 20 || en.x > FIELD.width - 20) en.vx *= -1;
      if (en.y < 20 || en.y > FIELD.height - 20) en.vy *= -1;
      en.fireTimer -= dt;
      if (en.fireTimer <= 0) {
        en.fireTimer = ENEMY.fireRate;
        const angle = Math.atan2(ship.y - en.y, ship.x - en.x);
        s.enemyLasers.push({
          x: en.x,
          y: en.y,
          vx: Math.cos(angle) * 260,
          vy: Math.sin(angle) * 260,
          life: 2.5,
        });
      }
      // Collide laser
      for (let j = s.lasers.length - 1; j >= 0; j--) {
        const l = s.lasers[j];
        if (Math.hypot(l.x - en.x, l.y - en.y) < ENEMY.radius) {
          s.lasers.splice(j, 1);
          s.enemies.splice(i, 1);
          if (!demoMode) playExplosion(true);
          this.addParticles(en.x, en.y, '#ff0055', 20);
          s.score += ENEMY.points * s.multiplier;
          s.multiplier = Math.min(8, s.multiplier + 1);
          s.multiplierTimer = 4.0;
          break;
        }
      }
    }

    // Update Asteroids & Collisions
    for (let i = s.asteroids.length - 1; i >= 0; i--) {
      const a = s.asteroids[i];
      a.x = (a.x + a.vx * dt + FIELD.width) % FIELD.width;
      a.y = (a.y + a.vy * dt + FIELD.height) % FIELD.height;
      a.rot += a.rotSpeed * dt;

      // Ship collision
      if (ship.invulnerable <= 0 && Math.hypot(ship.x - a.x, ship.y - a.y) < a.radius + SHIP.radius - 2) {
        this.hitShip(demoMode);
      }

      // Laser collision
      for (let j = s.lasers.length - 1; j >= 0; j--) {
        const l = s.lasers[j];
        if (Math.hypot(l.x - a.x, l.y - a.y) < a.radius) {
          s.lasers.splice(j, 1);
          const tier = a.tier;
          const ax = a.x;
          const ay = a.y;
          s.asteroids.splice(i, 1);
          if (!demoMode) playExplosion(tier === 0);
          this.addParticles(ax, ay, '#ff00bb', tier === 0 ? 18 : 10);
          s.score += ASTEROID.tierPoints[tier] * s.multiplier;
          s.multiplier = Math.min(8, s.multiplier + 1);
          s.multiplierTimer = 4.0;

          // Spawn smaller asteroids
          if (tier < 2) {
            this.spawnAsteroid(tier + 1, ax, ay);
            this.spawnAsteroid(tier + 1, ax, ay);
          } else {
            // Chance to drop powerup
            if (this.rng.next() < 0.22) {
              const types = ['spread', 'rapid', 'shield'];
              const type = types[Math.floor(this.rng.next() * types.length)];
              s.powerups.push({
                x: ax,
                y: ay,
                type,
                life: 12.0,
              });
            }
          }
          events |= EVENT_SCORE;
          break;
        }
      }
    }

    // Update powerups
    for (let i = s.powerups.length - 1; i >= 0; i--) {
      const p = s.powerups[i];
      p.life -= dt;
      if (p.life <= 0) {
        s.powerups.splice(i, 1);
        continue;
      }
      if (Math.hypot(ship.x - p.x, ship.y - p.y) < SHIP.radius + POWERUP.radius) {
        if (!demoMode) playPowerup();
        if (p.type === 'shield') {
          ship.invulnerable = 6.0;
        } else {
          ship.powerup = p.type;
          ship.powerupTime = POWERUP.duration;
        }
        this.addParticles(p.x, p.y, '#00ff88', 15);
        s.score += 150;
        s.powerups.splice(i, 1);
      }
    }

    // Update particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) s.particles.splice(i, 1);
    }

    // Check wave complete
    if (s.asteroids.length === 0 && s.enemies.length === 0) {
      this.spawnWave(s.wave + 1);
    }

    return events;
  }

  hitShip(demoMode) {
    const s = this.state;
    this.addParticles(s.ship.x, s.ship.y, '#00ffff', 25, 1.8);
    if (!demoMode) playExplosion(true);
    s.lives -= 1;
    s.multiplier = 1;
    s.ship.invulnerable = SHIP.invulnerableTime;
    s.ship.vx = 0;
    s.ship.vy = 0;
    s.ship.powerup = null;
    if (s.lives <= 0) {
      s.over = true;
      if (!demoMode) playGameOver();
    }
  }
}
