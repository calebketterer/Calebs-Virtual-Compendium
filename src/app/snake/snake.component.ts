import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Coord { x: number; y: number; }
interface Difficulty { label: string; interval: number; }

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snake.component.html',
  styleUrls: ['./snake.component.css']
})
export class SnakeComponent implements OnInit, OnDestroy {
  boardSize = 16;
  board: string[][] = [];
  snake: Coord[] = [];
  direction: Direction = 'UP'; // Start vertical
  nextDirection: Direction = 'UP'; // Start vertical
  food: Coord = { x: 8, y: 8 };
  gameOver = false;
  score = 0;
  moveInterval: any;
  moveIntervalTime = 160;
  difficulties: Difficulty[] = [
    { label: 'Easy', interval: 200 },
    { label: 'Medium', interval: 130 },
    { label: 'Hard', interval: 75 },
    { label: 'Extreme', interval: 40 }
  ];
  selectedDifficultyIdx = 1; // Default to Medium

  gameStarted = false;

  private snakeTitleEl: HTMLElement | null = null;

  ngOnInit(): void {
    this.resetGame(false);
    setTimeout(() => this.attachSnakeTitleGradientHandler(), 0);
  }

  ngOnDestroy(): void {
    this.detachSnakeTitleGradientHandler();
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
    }
  }

  startGame(): void {
    if (this.gameStarted || this.gameOver) return;
    this.gameStarted = true;
    this.moveIntervalTime = this.difficulties[this.selectedDifficultyIdx].interval;
    this.moveInterval = setInterval(() => this.moveSnake(), this.moveIntervalTime);
  }

  onStartButton(): void {
    this.startGame();
  }

  resetGame(startNew: boolean): void {
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
    }
    this.direction = 'UP';
    this.nextDirection = 'UP';
    this.snake = [
      { x: 8, y: 7 },
      { x: 8, y: 8 },
      { x: 8, y: 9 }
    ];
    this.placeFood();
    this.score = 0;
    this.gameOver = false;
    this.gameStarted = false; // wait for user input
    this.buildBoard();
  }

  buildBoard(): void {
    this.board = [];
    for (let y = 0; y < this.boardSize; y++) {
      const row: string[] = [];
      for (let x = 0; x < this.boardSize; x++) {
        row.push('empty');
      }
      this.board.push(row);
    }
    for (const segment of this.snake) {
      if (this.inBounds(segment)) {
        this.board[segment.y][segment.x] = 'snake';
      }
    }
    if (this.inBounds(this.food)) {
      this.board[this.food.y][this.food.x] = 'food';
    }
  }

  inBounds(coord: Coord): boolean {
    return (
      coord.x >= 0 && coord.x < this.boardSize &&
      coord.y >= 0 && coord.y < this.boardSize
    );
  }

  moveSnake(): void {
    if (this.gameOver || !this.gameStarted) return;

    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };
    switch (this.direction) {
      case 'UP':    head.y--; break;
      case 'DOWN':  head.y++; break;
      case 'LEFT':  head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    if (!this.inBounds(head)) {
      this.endGame();
      return;
    }

    if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.placeFood();
    } else {
      this.snake.pop();
    }

    this.buildBoard();
  }

  placeFood(): void {
    let emptyCells: Coord[] = [];
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (!this.snake.some(seg => seg.x === x && seg.y === y)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length === 0) {
      this.endGame();
      return;
    }
    this.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  endGame(): void {
    this.gameOver = true;
    this.gameStarted = false;
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
    }
  }

  getCellClass(cell: string): string {
    switch (cell) {
      case 'snake': return 'snake-cell';
      case 'food': return 'food-cell';
      default: return 'empty-cell';
    }
  }

  moveUp(): void {
    if (!this.gameStarted || this.direction === 'DOWN') return;
    this.nextDirection = 'UP';
  }
  moveDown(): void {
    if (!this.gameStarted || this.direction === 'UP') return;
    this.nextDirection = 'DOWN';
  }
  moveLeft(): void {
    if (!this.gameStarted || this.direction === 'RIGHT') return;
    this.nextDirection = 'LEFT';
  }
  moveRight(): void {
    if (!this.gameStarted || this.direction === 'LEFT') return;
    this.nextDirection = 'RIGHT';
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (this.gameOver) return;
    if (!this.gameStarted) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        this.moveUp();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.moveDown();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.moveLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.moveRight();
        break;
    }
  }

  onDifficultyChange(event: any): void {
    this.selectedDifficultyIdx = Number(event.target.value);
    this.resetGame(true);
  }

  // --- Interactive Snake Title ---
  private snakeTitleListenerAttached = false;

  private attachSnakeTitleGradientHandler() {
    this.snakeTitleEl = document.getElementById('snakeTitle');
    if (!this.snakeTitleEl || this.snakeTitleListenerAttached) return;

    this.snakeTitleEl.addEventListener('mousemove', this.handleSnakeTitleMove);
    this.snakeTitleEl.addEventListener('touchmove', this.handleSnakeTitleMove, { passive: false });
    this.snakeTitleEl.addEventListener('mouseleave', this.resetSnakeTitleGradient);
    this.snakeTitleEl.addEventListener('touchend', this.resetSnakeTitleGradient as any);
    this.snakeTitleEl.addEventListener('touchcancel', this.resetSnakeTitleGradient as any);

    this.snakeTitleListenerAttached = true;
  }

  private detachSnakeTitleGradientHandler() {
    if (!this.snakeTitleEl || !this.snakeTitleListenerAttached) return;
    this.snakeTitleEl.removeEventListener('mousemove', this.handleSnakeTitleMove);
    this.snakeTitleEl.removeEventListener('touchmove', this.handleSnakeTitleMove);
    this.snakeTitleEl.removeEventListener('mouseleave', this.resetSnakeTitleGradient);
    this.snakeTitleEl.removeEventListener('touchend', this.resetSnakeTitleGradient as any);
    this.snakeTitleEl.removeEventListener('touchcancel', this.resetSnakeTitleGradient as any);
    this.snakeTitleListenerAttached = false;
  }

  private handleSnakeTitleMove = (e: MouseEvent | TouchEvent) => {
    if (!this.snakeTitleEl) return;
    let rect = this.snakeTitleEl.getBoundingClientRect();
    let x = 0.5, y = 0.5;

    if (e instanceof TouchEvent && e.touches.length) {
      const touch = e.touches[0];
      x = (touch.clientX - rect.left) / rect.width;
      y = (touch.clientY - rect.top) / rect.height;
    } else if (e instanceof MouseEvent) {
      x = (e.clientX - rect.left) / rect.width;
      y = (e.clientY - rect.top) / rect.height;
    }

    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    const angle = Math.round(90 + (x - 0.5) * 60);
    const pos = Math.round(x * 100);
    this.snakeTitleEl.style.background = `linear-gradient(${angle}deg, oklch(55.34% 0.1608 140.47) 0%, oklch(60% 0.17 140.47) ${pos}%, oklch(43% 0.13 140.47) 100%)`;
    this.snakeTitleEl.style.webkitBackgroundClip = 'text';
    this.snakeTitleEl.style.backgroundClip = 'text';
    this.snakeTitleEl.style.webkitTextFillColor = 'transparent';
  };

  private resetSnakeTitleGradient = () => {
    if (this.snakeTitleEl) {
      this.snakeTitleEl.style.background =
        'linear-gradient(90deg, oklch(55.34% 0.1608 140.47) 0%, oklch(60% 0.17 140.47) 50%, oklch(43% 0.13 140.47) 100%)';
      this.snakeTitleEl.style.webkitBackgroundClip = 'text';
      this.snakeTitleEl.style.backgroundClip = 'text';
      this.snakeTitleEl.style.webkitTextFillColor = 'transparent';
    }
  };
}