import { Injectable } from '@angular/core';
import { HighScore } from './diep.interfaces';

@Injectable({
  providedIn: 'root'
})
export class HighScoresService {
  // Using localStorage for persistence
  private readonly STORAGE_KEY = 'diepSpHighScores';
  private readonly MAX_SCORES = 5;

  /**
   * Retrieves high scores from localStorage, parses, sorts, and limits to MAX_SCORES.
   */
  getHighScores(): HighScore[] {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) {
        return [];
      }
      
      // Parse the JSON array of HighScore objects
      const scores: HighScore[] = JSON.parse(json);

      // Ensure they are sorted before returning
      return this.sortScores(scores).slice(0, this.MAX_SCORES);
    } catch (e) {
      console.error("Error reading or parsing high scores from localStorage:", e);
      return [];
    }
  }

  /**
   * Adds a new score, updates the list, sorts it, and saves the top 5 back to localStorage.
   * @param newScore The player's final score.
   */
  addHighScore(newScore: number): void {
    if (newScore <= 0) return; // Only save positive scores

    const currentScores = this.getHighScores();
    
    // Create new entry with current date/time
    const newEntry: HighScore = {
      score: newScore,
      date: new Date().toISOString() // Store date as a standard ISO string
    };

    currentScores.push(newEntry);

    // Sort the combined list and keep only the top 5 highest scores
    const topScores = this.sortScores(currentScores).slice(0, this.MAX_SCORES);

    // Save to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topScores));
    } catch (e) {
      console.error("Error saving high scores to localStorage:", e);
    }
  }

  /**
   * Sorts scores by score (descending) and then date (oldest first for ties).
   */
  private sortScores(scores: HighScore[]): HighScore[] {
    return scores.sort((a, b) => {
      // Primary sort: Score (Descending: b - a)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Secondary sort (tiebreaker): Date (Ascending: a - b, oldest score wins tie)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }
}
