import { Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-diep',
  templateUrl: './diep.component.html',
  styleUrls: ['./diep.component.css'],
  standalone: true,
})
export class DiepComponent implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;

  // Game state
  player = { x: 400, y: 300, radius: 20, angle: 0, speed: 0, maxSpeed: 3, color: '#3498db', health: 100, maxHealth: 100 };
  bullets: Array<{ x: number, y: number, dx: number, dy: number, radius: number, color: string }> = [];
  enemies: Array<{ x: number, y: number, radius: number, color: string, health: number }> = [];
  keys: { [key: string]: boolean } = {};
  width = 800;
  height = 600;
  score = 0;
  gameOver = false;
  lastAngle = 0; // To preserve last movement direction
  mouseAiming = false;
  mousePos = { x: 0, y: 0 };
  mouseDown = false;

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.spawnEnemies(5);
    this.gameLoop();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = true;
    if (event.key === ' ') {
      this.shootBullet();
    }
    if (event.key.toLowerCase() === 'm') {
      this.mouseAiming = !this.mouseAiming;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = false;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.mouseAiming) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mousePos.x = event.clientX - rect.left;
    this.mousePos.y = event.clientY - rect.top;
  }

  @HostListener('window:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (!this.mouseAiming || this.gameOver) return;
    if (event.button === 0) {
      this.mouseDown = true;
      this.shootBullet();
    }
  }

  @HostListener('window:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (event.button === 0) {
      this.mouseDown = false;
    }
  }

  shootBullet() {
    if (this.gameOver) return;
    const speed = 8;
    let angle = this.player.angle;
    if (this.mouseAiming) {
      angle = Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x);
      this.player.angle = angle;
      this.lastAngle = angle;
    } else {
      // Use lastAngle for shooting, update only if movement keys are pressed
      if (this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d']) {
        angle = Math.atan2(
          (this.keys['s'] ? 1 : 0) - (this.keys['w'] ? 1 : 0),
          (this.keys['d'] ? 1 : 0) - (this.keys['a'] ? 1 : 0)
        );
        if (!isNaN(angle)) {
          this.player.angle = angle;
          this.lastAngle = angle;
        }
      } else {
        angle = this.lastAngle;
      }
    }
    this.bullets.push({
      x: this.player.x + Math.cos(angle) * this.player.radius,
      y: this.player.y + Math.sin(angle) * this.player.radius,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: 6,
      color: '#f39c12'
    });
  }

  spawnEnemies(count: number) {
    for (let i = 0; i < count; i++) {
      this.enemies.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 18 + Math.random() * 10,
        color: '#e74c3c',
        health: 40 + Math.random() * 60
      });
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    if (!this.gameOver) {
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  update() {
    if (this.gameOver) return;
    // Player movement
    let moved = false;
    let dx = 0, dy = 0;
    if (this.keys['w']) { dy -= 1; moved = true; }
    if (this.keys['s']) { dy += 1; moved = true; }
    if (this.keys['a']) { dx -= 1; moved = true; }
    if (this.keys['d']) { dx += 1; moved = true; }
    if (moved) {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.player.x += (dx / len) * this.player.maxSpeed;
      this.player.y += (dy / len) * this.player.maxSpeed;
      // Only update angle and lastAngle if actually moving
      if (dx !== 0 || dy !== 0) {
        const newAngle = Math.atan2(dy, dx);
        if (!isNaN(newAngle)) {
          this.player.angle = newAngle;
          this.lastAngle = newAngle;
        }
      }
    }
    // Clamp player position
    this.player.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.x));
    this.player.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.y));

    // Bullets update
    this.bullets.forEach(bullet => {
      bullet.x += bullet.dx;
      bullet.y += bullet.dy;
    });
    // Remove bullets out of bounds
    this.bullets = this.bullets.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);

    // Mouse aiming: auto-fire if mouse is held down
    if (this.mouseAiming && this.mouseDown && !this.gameOver) {
      if (!this.lastShotTime || Date.now() - this.lastShotTime > 120) {
        this.shootBullet();
        this.lastShotTime = Date.now();
      }
    }

    // Enemy AI: move toward player
    this.enemies.forEach(enemy => {
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        enemy.x += (dx / dist) * 1.2;
        enemy.y += (dy / dist) * 1.2;
      }
    });

    // Bullet collision with enemies
    this.bullets.forEach(bullet => {
      this.enemies.forEach(enemy => {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bullet.radius + enemy.radius) {
          enemy.health -= 20;
          bullet.x = -100; // Remove bullet
          if (enemy.health <= 0) this.score += 100;
        }
      });
    });
    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.health > 0);
    // Respawn enemies if all are dead
    if (this.enemies.length === 0) this.spawnEnemies(5);

    // Enemy collision with player
    this.enemies.forEach(enemy => {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < enemy.radius + this.player.radius) {
        this.player.health -= 0.5;
      }
    });
    if (this.player.health <= 0) {
      this.player.health = 0;
      this.gameOver = true;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    // Draw player
    if (!this.gameOver) {
      this.ctx.save();
      this.ctx.translate(this.player.x, this.player.y);
      this.ctx.rotate(this.player.angle);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.player.color;
      this.ctx.fill();
      // Draw barrel
      this.ctx.beginPath();
      this.ctx.rect(this.player.radius - 2, -5, 24, 10);
      this.ctx.fillStyle = '#2980b9';
      this.ctx.fill();
      this.ctx.restore();
    }

    // Draw bullets
    this.bullets.forEach(bullet => {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = bullet.color;
      this.ctx.fill();
    });

    // Draw enemies
    this.enemies.forEach(enemy => {
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = enemy.color;
      this.ctx.fill();
      // Health bar
      this.ctx.fillStyle = '#2ecc40';
      this.ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 10, enemy.radius * 2 * (enemy.health / 100), 5);
    });

    // Draw player health (bar and fraction)
    this.ctx.fillStyle = '#2ecc40';
    this.ctx.fillRect(20, 20, (this.player.health / this.player.maxHealth) * 200, 12);
    this.ctx.strokeStyle = '#333';
    this.ctx.strokeRect(20, 20, 200, 12);
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#333';
    this.ctx.fillText(`${Math.ceil(this.player.health)} / ${this.player.maxHealth}`, 90, 32);

    // Draw score and title
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#333';
    this.ctx.fillText('Diep.io Singleplayer', this.width / 2 - 120, 40);
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Score: ' + this.score, this.width / 2 - 40, 70);

    // Game over
    if (this.gameOver) {
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillStyle = '#8e44ad'; // Unique purple for game over
      this.ctx.fillText('Game Over', this.width / 2 - 140, this.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillStyle = '#333';
      this.ctx.fillText('Final Score: ' + this.score, this.width / 2 - 70, this.height / 2 + 40);
      // Draw replay button
      this.ctx.fillStyle = '#2980b9';
      this.ctx.fillRect(this.width / 2 - 60, this.height / 2 + 70, 120, 40);
      this.ctx.font = 'bold 22px Arial';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText('Replay', this.width / 2 - 32, this.height / 2 + 100);
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    if (!this.gameOver) return;
    // Check if click is inside the replay button
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (
      x >= this.width / 2 - 60 &&
      x <= this.width / 2 + 60 &&
      y >= this.height / 2 + 70 &&
      y <= this.height / 2 + 110
    ) {
      this.restartGame();
    }
  }

  restartGame() {
    this.player = { x: 400, y: 300, radius: 20, angle: 0, speed: 0, maxSpeed: 3, color: '#3498db', health: 100, maxHealth: 100 };
    this.bullets = [];
    this.enemies = [];
    this.keys = {};
    this.score = 0;
    this.gameOver = false;
    this.lastAngle = 0;
    this.mouseAiming = false;
    this.mouseDown = false;
    this.spawnEnemies(5);
    this.gameLoop();
  }

  private lastShotTime: number = 0;
}
