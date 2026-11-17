// Neon Asteroids: Cyber Core game configuration
export const FIELD = Object.freeze({
  width: 960,
  height: 600,
});

export const SHIP = Object.freeze({
  radius: 14,
  thrust: 320,
  rotateSpeed: Math.PI * 1.5,
  friction: 0.985,
  maxSpeed: 380,
  fireRate: 0.16,
  maxLives: 3,
  invulnerableTime: 2.5,
});

export const LASER = Object.freeze({
  speed: 650,
  radius: 2.5,
  life: 1.1,
});

export const ASTEROID = Object.freeze({
  tierSpeeds: [90, 130, 180],
  tierRadii: [38, 22, 12],
  tierPoints: [20, 50, 100],
});

export const ENEMY = Object.freeze({
  radius: 16,
  speed: 120,
  fireRate: 2.2,
  points: 250,
});

export const POWERUP = Object.freeze({
  radius: 14,
  duration: 8.0,
  speed: 45,
});

export const STEP = 1 / 60;
