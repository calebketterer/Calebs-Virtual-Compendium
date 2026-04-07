import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CARD_DATABASE } from './data/card-db';
import { NU_CARD_DATABASE } from './data/NU-db'; 
import { GwentCard } from './interfaces/gwent-card';

@Component({
  selector: 'app-gwent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gwent.component.html',
  styleUrls: ['./gwent.component.css']
})
export class GwentComponent implements OnInit {
  activePlayer = 1;
  turnPlayed = false;
  p1Passed = false;
  p2Passed = false;
  roundOver = false;
  gameOver = false;

  p1Cardback = ''; 
  p2Cardback = ''; 

  board: { [key: string]: GwentCard[] } = {
    p2Ranged: [], p2Melee: [],
    p1Melee: [], p1Ranged: []
  };

  handP1: GwentCard[] = [];
  handP2: GwentCard[] = [];
  deckP1: GwentCard[] = [];
  deckP2: GwentCard[] = [];

  p1Wins = 0;
  p2Wins = 0;
  tipLine = "Welcome to Gwent. Player 1 starts.";
  tipIsError = false;

  draggedData: { card: GwentCard, index: number } | null = null;

  ngOnInit() {
    this.fullReset();
  }

  get p1Score() { return this.calculateTotal(1); }
  get p2Score() { return this.calculateTotal(2); }

  calculateTotal(player: number): number {
    const rows = player === 1 ? ['p1Melee', 'p1Ranged'] : ['p2Melee', 'p2Ranged'];
    return rows.reduce((total, row) => total + this.board[row].reduce((s, c) => s + c.power, 0), 0);
  }

  fullReset() {
    this.board = { p2Ranged: [], p2Melee: [], p1Melee: [], p1Ranged: [] };
    this.p1Wins = 0; this.p2Wins = 0;
    this.p1Passed = false; this.p2Passed = false;
    this.roundOver = false; this.gameOver = false;
    this.activePlayer = 1;
    this.turnPlayed = false;

    this.deckP1 = this.generateDeck(1);
    this.deckP2 = this.generateDeck(2);
    
    this.handP1 = this.deckP1.splice(0, 10);
    this.handP2 = this.deckP2.splice(0, 10);
    
    this.tipLine = "Game Reset. Player 1's turn.";
  }

  generateDeck(player: number): GwentCard[] {
    let deck: GwentCard[] = [];
    
    if (CARD_DATABASE && CARD_DATABASE.length > 0) {
      CARD_DATABASE.forEach(dbCard => {
        deck.push({ ...dbCard, id: Math.random(), owner: player } as GwentCard);
      });
    }

    const remaining = 25 - deck.length;
    for (let i = 0; i < remaining; i++) {
      deck.push(this.createDefaultCard(player));
    }

    return deck.sort(() => Math.random() - 0.5);
  }

  createDefaultCard(player: number): GwentCard {
    const randomPower = Math.floor(Math.random() * 10) + 1;
    return {
      id: Math.random(),
      name: 'Unknown Unit',
      type: 'unit',
      power: randomPower,
      provisions: randomPower,
      artwork: '?',
      faction: 'NU',
      ability: 'No ability.',
      flavorText: 'Up for a round of Gwent?',
      owner: player,
      rarity: 'silver'
    };
  }

  getCardback(player: number): string {
    const custom = player === 1 ? this.p1Cardback : this.p2Cardback;
    return custom || 'assets/gwent/artwork/cardbacks/default.png';
  }

  handleCoinClick() {
    if (this.gameOver) return this.fullReset();
    if (this.roundOver) return this.startNextRound();
    this.turnPlayed ? this.endTurn() : this.passRound();
  }

  onDragStart(card: GwentCard, index: number) {
    if (card.owner !== this.activePlayer || this.turnPlayed) return;
    this.draggedData = { card, index };
  }

  onDrop(event: DragEvent, rowKey: string) {
    event.preventDefault();
    if (!this.draggedData) return;

    const isP1Row = rowKey.startsWith('p1');
    if ((this.activePlayer === 1 && !isP1Row) || (this.activePlayer === 2 && isP1Row)) {
      this.tipLine = "You cannot play on the opponent's side!";
      this.tipIsError = true;
      return;
    }

    this.board[rowKey].push(this.draggedData.card);
    if (this.activePlayer === 1) this.handP1.splice(this.draggedData.index, 1);
    else this.handP2.splice(this.draggedData.index, 1);

    this.turnPlayed = true;
    this.tipLine = "Card played. End turn or Pass.";
    this.tipIsError = false;
    this.draggedData = null;
  }

  allowDrop(event: DragEvent) { event.preventDefault(); }

  endTurn() {
    this.activePlayer = this.activePlayer === 1 ? 2 : 1;
    const nextPassed = this.activePlayer === 1 ? this.p1Passed : this.p2Passed;
    
    if (nextPassed) {
      this.activePlayer = this.activePlayer === 1 ? 2 : 1;
      this.tipLine = `Opponent passed. Your turn again.`;
    } else {
      this.tipLine = `Player ${this.activePlayer}'s turn.`;
    }
    this.turnPlayed = false;
  }

  passRound() {
    if (this.activePlayer === 1) this.p1Passed = true;
    else this.p2Passed = true;

    if (this.p1Passed && this.p2Passed) this.resolveRound();
    else this.endTurn();
  }

  resolveRound() {
    const s1 = this.p1Score; 
    const s2 = this.p2Score;
    let winnerText = "";

    if (s1 > s2) { this.p1Wins++; winnerText = "Player 1 wins!"; } 
    else if (s2 > s1) { this.p2Wins++; winnerText = "Player 2 wins!"; } 
    else { this.p1Wins++; this.p2Wins++; winnerText = "Draw!"; }

    this.gameOver = this.p1Wins >= 2 || this.p2Wins >= 2;
    this.roundOver = !this.gameOver;
    this.tipLine = this.gameOver ? `MATCH OVER.` : `${winnerText} Press RESET.`;
  }

  startNextRound() {
    this.board = { p2Ranged: [], p2Melee: [], p1Melee: [], p1Ranged: [] };
    this.p1Passed = false; 
    this.p2Passed = false;
    this.roundOver = false; 
    this.turnPlayed = false;

    const p1Needed = Math.min(this.deckP1.length, 10 - this.handP1.length, 3);
    const p2Needed = Math.min(this.deckP2.length, 10 - this.handP2.length, 3);

    this.handP1.push(...this.deckP1.splice(0, p1Needed));
    this.handP2.push(...this.deckP2.splice(0, p2Needed));
    
    this.tipLine = "New Round. Player 1 starts.";
  }
}