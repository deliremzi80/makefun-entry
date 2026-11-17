// Neon Canvas 2D Renderer
import { FIELD, SHIP } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_OVER = 2;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  render(world, screen, highScore = 0) {
    const ctx = this.ctx;
    const s = world.state;

    ctx.save();
    // Scale to fit canvas while preserving aspect ratio
    const scale = Math.min(this.canvas.width / FIELD.width, this.canvas.height / FIELD.height);
    const ox = (this.canvas.width - FIELD.width * scale) / 2;
    const oy = (this.canvas.height - FIELD.height * scale) / 2;
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    // Deep space background
    ctx.fillStyle = '#0a0b12';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    // Stars
    for (const star of s.stars) {
      ctx.fillStyle = `rgba(180, 220, 255, ${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    // Grid effect
    ctx.strokeStyle = 'rgba(20, 40, 80, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height);
    }
    for (let y = 0; y <= FIELD.height; y += 60) {
      ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y);
    }
    ctx.stroke();

    // Powerups
    for (const p of s.powerups) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00ffaa';
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.type === 'shield' ? 'S' : p.type === 'rapid' ? 'R' : '3X', p.x, p.y);
      ctx.restore();
    }

    // Asteroids
    for (const a of s.asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff00bb';
      ctx.strokeStyle = '#ff00bb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const ang = (i / sides) * Math.PI * 2;
        const rad = a.radius * (i % 2 === 0 ? 1 : 0.82);
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // Enemies (Cruisers)
    for (const en of s.enemies) {
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ff2255';
      ctx.strokeStyle = '#ff2255';
      ctx.fillStyle = 'rgba(255, 34, 85, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -12);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Enemy lasers
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff2255';
    ctx.fillStyle = '#ff2255';
    for (const el of s.enemyLasers) {
      ctx.beginPath();
      ctx.arc(el.x, el.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player lasers
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    for (const l of s.lasers) {
      ctx.beginPath();
      ctx.arc(l.x, l.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    for (const p of s.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    // Player Ship
    const ship = s.ship;
    if (!s.over && (ship.invulnerable <= 0 || Math.floor(s.time * 12) % 2 === 0)) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#00ffff';
      ctx.strokeStyle = '#00ffff';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-7, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shield ring if powerup active or respawn
      if (ship.invulnerable > 0) {
        ctx.strokeStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // HUD Header (Always visible in Play / Over)
    this.renderHUD(ctx, s, highScore);

    // Screen Overlays
    if (screen === SCREEN_TITLE) {
      this.renderTitle(ctx);
    } else if (screen === SCREEN_OVER) {
      this.renderGameOver(ctx, s);
    }

    ctx.restore();
  }

  renderHUD(ctx, s, highScore) {
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${s.score}`, 24, 32);

    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText(`HIGH: ${Math.max(s.score, highScore)}`, FIELD.width / 2, 32);

    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.textAlign = 'right';
    ctx.fillText(`WAVE: ${s.wave}`, FIELD.width - 24, 32);

    // Multiplier
    if (s.multiplier > 1) {
      ctx.fillStyle = '#ff00bb';
      ctx.shadowColor = '#ff00bb';
      ctx.textAlign = 'left';
      ctx.fillText(`${s.multiplier}X MULTIPLIER`, 24, 58);
    }

    // Active powerup
    if (s.ship.powerup) {
      ctx.fillStyle = '#00ffaa';
      ctx.shadowColor = '#00ffaa';
      ctx.textAlign = 'right';
      ctx.fillText(`POWERUP: ${s.ship.powerup.toUpperCase()} (${s.ship.powerupTime.toFixed(1)}s)`, FIELD.width - 24, 58);
    }

    // Lives icons
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    for (let i = 0; i < s.lives; i++) {
      ctx.save();
      ctx.translate(28 + i * 22, FIELD.height - 24);
      ctx.rotate(-Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(8, 0); ctx.lineTo(-6, -5); ctx.lineTo(-3, 0); ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  renderTitle(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 11, 18, 0.75)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.shadowBlur = 24;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.font = '900 52px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEON ASTEROIDS', FIELD.width / 2, FIELD.height / 2 - 70);

    ctx.shadowColor = '#ff00bb';
    ctx.fillStyle = '#ff00bb';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('CYBER CORE SURVIVAL', FIELD.width / 2, FIELD.height / 2 - 20);

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffaa';
    ctx.fillStyle = '#00ffaa';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('CONTROLS: WASD / ARROWS to Fly | SPACE to Shoot | R to Restart', FIELD.width / 2, FIELD.height / 2 + 50);

    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('[ PRESS SPACE OR CLICK TO START ]', FIELD.width / 2, FIELD.height / 2 + 110);
    ctx.restore();
  }

  renderGameOver(ctx, s) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 11, 18, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);

    ctx.shadowBlur = 24;
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    ctx.font = '900 56px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', FIELD.width / 2, FIELD.height / 2 - 60);

    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText(`FINAL SCORE: ${s.score}`, FIELD.width / 2, FIELD.height / 2 + 10);
    ctx.fillText(`REACHED WAVE: ${s.wave}`, FIELD.width / 2, FIELD.height / 2 + 45);

    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillText('[ PRESS R OR CLICK TO PLAY AGAIN ]', FIELD.width / 2, FIELD.height / 2 + 110);
    ctx.restore();
  }
}
