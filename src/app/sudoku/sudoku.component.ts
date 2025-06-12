import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.css'],
})
export class SudokuComponent {
  START_PUZZLE = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];

  SOLUTION = [
    [5,3,4,6,7,8,9,1,2],
    [6,7,2,1,9,5,3,4,8],
    [1,9,8,3,4,2,5,6,7],
    [8,5,9,7,6,1,4,2,3],
    [4,2,6,8,5,3,7,9,1],
    [7,1,3,9,2,4,8,5,6],
    [9,6,1,5,3,7,2,8,4],
    [2,8,7,4,1,9,6,3,5],
    [3,4,5,2,8,6,1,7,9],
  ];

  puzzle = JSON.parse(JSON.stringify(this.START_PUZZLE));
  initial = JSON.parse(JSON.stringify(this.START_PUZZLE));
  selectedCell: { row: number; col: number } | null = null;
  errorCells = new Set<string>();
  correctCells = new Set<string>();
  checkMode = false;
  showResult = false;
  resultMessage = '';
  revealMode = false;
  userInputsBackup: number[][] = [];
  checkCount = 0;

  selectCell(row: number, col: number) {
    if (!this.revealMode && this.initial[row][col] === 0) {
      this.selectedCell = { row, col };
    }
  }

  handleKey(event: KeyboardEvent) {
    if (this.revealMode) return;
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    if (event.key >= '1' && event.key <= '9') {
      this.puzzle[row][col] = Number(event.key);
    } else if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === '0'
    ) {
      this.puzzle[row][col] = 0;
    }
    if (this.checkMode) {
      this.checkMode = false;
      this.errorCells.clear();
      this.correctCells.clear();
      this.showResult = false;
    }
  }

  isInitial(row: number, col: number) {
    return this.initial[row][col] !== 0;
  }

  isErrorCell(row: number, col: number) {
    return this.errorCells.has(`${row},${col}`);
  }

  isCorrectCell(row: number, col: number) {
    return this.correctCells.has(`${row},${col}`);
  }

  reset() {
    this.puzzle = JSON.parse(JSON.stringify(this.START_PUZZLE));
    this.selectedCell = null;
    this.errorCells.clear();
    this.correctCells.clear();
    this.checkMode = false;
    this.showResult = false;
    this.resultMessage = '';
    this.revealMode = false;
    this.userInputsBackup = [];
    this.checkCount = 0;
  }

  checkAnswers() {
    if (this.revealMode) return;
    this.errorCells.clear();
    this.correctCells.clear();
    let allFilled = true;
    let allCorrect = true;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.initial[i][j] !== 0) continue;
        if (this.puzzle[i][j] === 0) {
          allFilled = false;
        }
        if (this.puzzle[i][j] !== 0 && this.puzzle[i][j] !== this.SOLUTION[i][j]) {
          this.errorCells.add(`${i},${j}`);
          allCorrect = false;
        } else if (this.puzzle[i][j] === this.SOLUTION[i][j]) {
          this.correctCells.add(`${i},${j}`);
        }
      }
    }
    this.checkMode = true;
    this.showResult = true;
    this.checkCount++;
    if (!allFilled) {
      this.resultMessage = 'Keep going! Some cells are still empty.';
    } else if (allCorrect) {
      this.resultMessage = '🎉 Congratulations! You solved it!';
    } else {
      this.resultMessage = 'Some answers are incorrect. Try again!';
    }
  }

  toggleRevealSolution() {
    if (!this.revealMode) {
      this.userInputsBackup = this.puzzle.map((row: number[]) => row.slice());
      this.puzzle = this.SOLUTION.map((row: number[]) => row.slice());
      this.revealMode = true;
      this.selectedCell = null;
    } else {
      if (this.userInputsBackup.length === 9) {
        this.puzzle = this.userInputsBackup.map((row: number[]) => row.slice());
      }
      this.revealMode = false;
    }
    this.errorCells.clear();
    this.correctCells.clear();
    this.checkMode = false;
    this.showResult = false;
    this.resultMessage = '';
  }
}