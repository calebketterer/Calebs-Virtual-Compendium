import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

type Cell = 'empty' | 'snake' | 'food';

interface Position {
  x: number;
  y: number;
}

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snake.component.html',
  styleUrls: ['./snake.component.css']
})
export class SnakeComponent implements OnInit, OnDestroy {
  readonly boardSize = 16;
  board: Cell[][] = [];
  snake: Position[] = [];
  direction: Position = { x: 0, y: -1 }; // Start up
  nextDirection: Position = { x: 0, y: -1 };
  food: Position = { x: 0, y: 0 };
  score = 0;
  gameOver = false;
  intervalId: any = null;
  started = false;

  difficulties = [
    { label: 'Easy', speed: 180 },
    { label: 'Normal', speed: 100 },
    { label: 'Hard', speed: 60 },
    { label: 'Impossible', speed: 30 }
  ];
  selectedDifficultyIdx = 1; // Default to Normal

  get selectedDifficulty() {
    return this.difficulties[this.selectedDifficultyIdx];
  }

  ngOnInit() {
    this.resetGame(false); // Do not start on load
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  resetGame(start: boolean = false) {
    this.score = 0;
    this.snake = [
      { x: Math.floor(this.boardSize / 2), y: Math.floor(this.boardSize / 2) }
    ];
    this.direction = { x: 0, y: -1 };
    this.nextDirection = { x: 0, y: -1 };
    this.placeFood();
    this.gameOver = false;
    this.started = start;
    this.updateBoard();
    if (this.intervalId) clearInterval(this.intervalId);
    if (start) this.startGame();
  }

  startGame() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.started = true;
    this.gameOver = false;
    this.intervalId = setInterval(() => this.gameLoop(), this.selectedDifficulty.speed);
  }

  gameLoop() {
    if (this.gameOver || !this.started) return;
    // Use nextDirection if not reversing
    if (
      this.snake.length < 2 ||
      !(this.nextDirection.x === -this.direction.x && this.nextDirection.y === -this.direction.y)
    ) {
      this.direction = { ...this.nextDirection };
    }
    const newHead = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };
    // Check wall or self collision
    if (
      newHead.x < 0 || newHead.x >= this.boardSize ||
      newHead.y < 0 || newHead.y >= this.boardSize ||
      this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
    ) {
      this.gameOver = true;
      this.started = false;
      clearInterval(this.intervalId);
      return;
    }
    this.snake.unshift(newHead);
    // Food check
    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score++;
      this.placeFood();
    } else {
      this.snake.pop();
    }
    this.updateBoard();
  }

  updateBoard() {
    this.board = Array(this.boardSize).fill(0).map(() =>
      Array(this.boardSize).fill('empty')
    );
    for (const s of this.snake) {
      this.board[s.y][s.x] = 'snake';
    }
    this.board[this.food.y][this.food.x] = 'food';
  }

  placeFood() {
    let position: Position;
    do {
      position = {
        x: Math.floor(Math.random() * this.boardSize),
        y: Math.floor(Math.random() * this.boardSize),
      };
    } while (this.snake.some(s => s.x === position.x && s.y === position.y));
    this.food = position;
  }

  onDifficultyChange(event: Event) {
    const idx = +(event.target as HTMLSelectElement).value;
    this.selectedDifficultyIdx = idx;
    if (this.started) {
      this.startGame(); // Restart interval with new speed
    }
  }

  // WASD controls only!
  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    if (this.gameOver) return;
    switch (e.key.toLowerCase()) {
      case 'w':
        if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
        if (!this.started) this.startGame();
        break;
      case 's':
        if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
        if (!this.started) this.startGame();
        break;
      case 'a':
        if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
        if (!this.started) this.startGame();
        break;
      case 'd':
        if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
        if (!this.started) this.startGame();
        break;
    }
  }

  // On-screen button controls (for mobile/friendly play)
  moveUp() {
    if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
    if (!this.started) this.startGame();
  }
  moveDown() {
    if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
    if (!this.started) this.startGame();
  }
  moveLeft() {
    if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
    if (!this.started) this.startGame();
  }
  moveRight() {
    if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
    if (!this.started) this.startGame();
  }

  getCellClass(cell: Cell): string {
    switch (cell) {
      case 'snake': return 'snake-cell';
      case 'food': return 'food-cell';
      default: return 'empty-cell';
    }
  }
}