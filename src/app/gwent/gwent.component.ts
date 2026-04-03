import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Card {
  id: number;
  name: string;
  power: number;
  ability: string;
  imageName: string;
  owner: number; 
}

@Component({
  selector: 'app-gwent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gwent.component.html',
  styleUrls: ['./gwent.component.css']
})
export class GwentComponent implements OnInit {
  activePlayer: number = 1;
  turnPlayed: boolean = false; 
  tipLine: string = "Welcome to Vibood's Gwent. Player 1, play or pass.";
  tipIsError: boolean = false;

  p1Passed: boolean = false;
  p2Passed: boolean = false;
  roundOver: boolean = false;
  gameOver: boolean = false;

  p1Wins: number = 0;
  p2Wins: number = 0;

  handP1: Card[] = [];
  handP2: Card[] = [];
  
  board: { [key: string]: Card[] } = {
    p2Ranged: [], p2Melee: [],
    p1Melee: [], p1Ranged: []
  };

  draggedData: { card: Card, index: number } | null = null;

  ngOnInit() {
    this.generateDecks();
  }

  generateDecks() {
    this.handP1 = [];
    this.handP2 = [];
    const createCard = (p: number, id: number) => ({
      id, name: `Unit`, 
      power: Math.floor(Math.random() * 10) + 1, 
      ability: 'none', imageName: 'card.jpg', owner: p 
    });
    for (let i = 0; i < 10; i++) {
      this.handP1.push(createCard(1, i));
      this.handP2.push(createCard(2, i + 100));
    }
  }

  onDragStart(card: Card, index: number) {
    const hasPassed = (this.activePlayer === 1 && this.p1Passed) || (this.activePlayer === 2 && this.p2Passed);
    if (card.owner !== this.activePlayer || this.turnPlayed || hasPassed || this.roundOver || this.gameOver) return;
    this.draggedData = { card, index };
  }

  onDrop(event: DragEvent, rowKey: string) {
    event.preventDefault();
    if (!this.draggedData) return;

    const isOwnRow = (this.activePlayer === 1 && rowKey.startsWith('p1')) || 
                      (this.activePlayer === 2 && rowKey.startsWith('p2'));

    if (isOwnRow) {
      this.board[rowKey].push(this.draggedData.card);
      this.activePlayer === 1 ? this.handP1.splice(this.draggedData.index, 1) : this.handP2.splice(this.draggedData.index, 1);
      this.turnPlayed = true;
      this.draggedData = null;
      this.tipLine = "Turn played. Use the coin to end.";
      this.tipIsError = false;
    } else {
      this.showError("⚠️ You must play on your own rows!");
    }
  }

  handleCoinClick() {
    if (this.gameOver) {
      this.fullReset();
      return;
    }
    if (this.roundOver) {
      this.startNextRound();
      return;
    }
    this.turnPlayed ? this.endTurn() : this.passRound();
  }

  endTurn() {
    this.turnPlayed = false;
    this.switchPlayers();
  }

  passRound() {
    if (this.activePlayer === 1) this.p1Passed = true;
    else this.p2Passed = true;

    if (this.p1Passed && this.p2Passed) this.resolveRound();
    else this.switchPlayers();
  }

  switchPlayers() {
    const opponent = this.activePlayer === 1 ? 2 : 1;
    const opponentPassed = (opponent === 1 && this.p1Passed) || (opponent === 2 && this.p2Passed);

    if (!opponentPassed) {
      this.activePlayer = opponent;
      this.tipLine = `Player ${this.activePlayer}'s turn.`;
    } else {
      this.tipLine = `Opponent passed. Continue or Pass?`;
    }
    this.tipIsError = false;
  }

  resolveRound() {
    const s1 = this.calculateScore(1);
    const s2 = this.calculateScore(2);
    this.roundOver = true;
    
    if (s1 > s2) {
      this.p1Wins++;
      this.tipLine = `Player 1 wins the round!`;
    } else if (s2 > s1) {
      this.p2Wins++;
      this.tipLine = `Player 2 wins the round!`;
    } else {
      this.p1Wins++; this.p2Wins++;
      this.tipLine = `Round is a draw! Both gain a win.`;
    }

    if (this.p1Wins >= 2 || this.p2Wins >= 2) {
      this.gameOver = true;
      const winner = this.p1Wins === this.p2Wins ? "Draw" : (this.p1Wins > this.p2Wins ? "Player 1" : "Player 2");
      this.tipLine = `MATCH OVER! ${winner === 'Draw' ? "It's a tie!" : winner + " wins!"} Click RESET.`;
    }
  }

  startNextRound() {
    Object.keys(this.board).forEach(key => this.board[key] = []);
    this.p1Passed = false; this.p2Passed = false;
    this.roundOver = false; this.turnPlayed = false;
    this.activePlayer = 1;
    this.tipLine = "Round started. Player 1's turn.";
    this.tipIsError = false;
  }

  fullReset() {
    this.p1Wins = 0;
    this.p2Wins = 0;
    this.gameOver = false;
    this.generateDecks();
    this.startNextRound();
    this.tipLine = "Game fully reset! Player 1 starts.";
  }

  calculateScore(player: number): number {
    const rows = player === 1 ? ['p1Melee', 'p1Ranged'] : ['p2Melee', 'p2Ranged'];
    return rows.reduce((total, row) => total + this.board[row].reduce((s, c) => s + c.power, 0), 0);
  }

  showError(msg: string) {
    const current = this.tipLine;
    this.tipLine = msg;
    this.tipIsError = true;
    setTimeout(() => {
      this.tipLine = current;
      this.tipIsError = false;
    }, 2000);
  }

  allowDrop(event: DragEvent) { event.preventDefault(); }
}