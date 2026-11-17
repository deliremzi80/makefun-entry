// Main entrypoint for Neon Asteroids: Cyber Core
import { attachControls } from './input.js';
import { Mulberry32 } from './random.js';
import { Renderer, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';
import { World, EVENT_OVER } from './world.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = new Renderer(canvas);

function fitCanvas() {
  renderer.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1337');
const rng = new Mulberry32(seed);

const world = new World(rng);
const controls = attachControls(canvas);

let currentScreen = SCREEN_TITLE;
let highScore = 0;
let lastTime = performance.now();

// Handle fixed staged shots
if (shotName) {
  const staged = stageShot(shotName, world);
  currentScreen = staged.screen;
  highScore = staged.best;
  renderer.render(world, currentScreen, highScore);
} else {
  // Main game loop
  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (currentScreen === SCREEN_TITLE) {
      if (controls.start || controls.fire) {
        controls.start = false;
        controls.fire = false;
        world.reset();
        currentScreen = SCREEN_PLAY;
        if (status) status.textContent = 'Game started. Wave 1.';
      }
    } else if (currentScreen === SCREEN_PLAY) {
      const event = world.step(dt, controls);
      if (world.state.over || (event & EVENT_OVER)) {
        currentScreen = SCREEN_OVER;
        if (world.state.score > highScore) highScore = world.state.score;
        if (status) status.textContent = `Game Over. Final score: ${world.state.score}.`;
      }
    } else if (currentScreen === SCREEN_OVER) {
      if (controls.restart || controls.start) {
        controls.restart = false;
        controls.start = false;
        world.reset();
        currentScreen = SCREEN_PLAY;
        if (status) status.textContent = 'Game restarted. Wave 1.';
      }
    }

    renderer.render(world, currentScreen, highScore);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
