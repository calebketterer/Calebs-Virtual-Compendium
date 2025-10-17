import { HighScore } from './diep.interfaces';

/**
 * diep.menus.ts
 *
 * Provides functions for drawing various UI elements, menus, and overlays onto the canvas context.
 */

// Define an interface to enforce which game state variables are required for drawing the menus.
interface MenuState {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  isGameStarted: boolean; // State to determine if the game is active or still on the start screen
  gameOver: boolean;
  isPaused: boolean;
  score: number;
  isDarkMode: boolean;
  deathAnimationTimeStart: number | null;
  topScores: HighScore[]; // NEW: Array of saved high scores for display
}

/** Defines the clickable area of a button. */
interface ButtonArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Defines the collection of buttons drawn on the game over screen. */
export interface GameOverButtons {
  replay: ButtonArea;
  mainMenu: ButtonArea;
}

/**
 * Utility class containing all methods responsible for drawing
 * UI elements, menus, and overlays onto the canvas context.
 */
export class DiepMenus {

  /**
   * Draws the Start Menu overlay screen, including the game title and the START button.
   * This screen is shown when the game has not yet started.
   * @param state The current game state and canvas context.
   */
  public static drawStartMenu(state: MenuState): void {
    const { ctx, width, height, isGameStarted } = state;

    if (!isGameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Dark overlay
      ctx.fillRect(0, 0, width, height);

      // Game Title
      ctx.font = 'bold 80px Inter, sans-serif';
      ctx.fillStyle = '#3498db'; // Blue color for the main title
      ctx.strokeStyle = '#3498db'; // Blue outline
      ctx.lineWidth = 10;
      ctx.textAlign = 'center';
      ctx.fillText('Diep Singleplayer', width / 2, height / 2 - 120);

      // Instructions/Motto
      ctx.font = 'italic bold 20px Inter, sans-serif';
      ctx.fillStyle = '#bdc3c7'; // Light grey secondary text
      ctx.fillText('Shape Warfare: Destroy Shapes and Dodge Enemies', width / 2, height / 2 - 60);

      // Draw START Button
      const btnW = 200;
      const btnH = 55;
      const btnX = width / 2 - (btnW / 2);
      const btnY = height / 2 + 20;

      ctx.fillStyle = '#2ecc71'; // Green color for the button
      ctx.fillRect(btnX, btnY, btnW, btnH);

      ctx.strokeStyle = '#27ae60'; // Darker green border
      ctx.lineWidth = 4;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.font = 'bold 30px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('START', width / 2, btnY + 37);

      // Small Hint
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('Use WASD to move and Mouse to aim.', width / 2, height / 2 + 120);
    }
  }

  /**
   * Draws the Game Over overlay screen, including the final score, High Scores list, 
   * and the Replay and Main Menu buttons.
   * @param state The current game state and canvas context.
   * @returns The coordinates of the clickable buttons, or null if the screen is not active.
   */
  public static drawGameOverScreen(state: MenuState): GameOverButtons | null {
    const { ctx, width, height, gameOver, deathAnimationTimeStart, score, topScores } = state;

    // Only draw if the game is over and the death animation has finished/not started
    if (gameOver && deathAnimationTimeStart === null) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);

      // --- 1. GAME OVER TITLE (CENTERED AND HIGH) ---
      const titleY = height / 2 - 150;
      ctx.font = 'bold 64px Inter, sans-serif';
      ctx.fillStyle = '#f1c40f'; // Yellow color
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

      // --- 2. FINAL SCORE (CENTERED AND HIGH) ---
      const scoreY = height / 2 - 100;
      ctx.font = '32px Inter, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 10);
      
      // --- 3. HIGH SCORES LIST (RIGHT SIDE QUADRANT) ---
      
      // Control the horizontal position using a ratio (0.5 is center, 0.75 is right)
      const hsListXRatio = 0.75; 
      const listCenterX = width * hsListXRatio; 
      
      // Title offset is 0 as we want the title centered over the two columns.
      const hsTitleOffsetX = 14; 
      
      let listTitleY = height / 2 + 80; 
      
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillStyle = '#3498db'; // Blue color
      ctx.textAlign = 'center'; 
      ctx.fillText('HIGH SCORES', listCenterX + hsTitleOffsetX, listTitleY); 
      
      // The vertical starting position of the first score entry.
      let listY = listTitleY + 25; 

      // Define column X positions relative to listCenterX for cleaner separation
      const scoreRightX = listCenterX - 15; // Score ends here (Right-aligned)
      const dateLeftX = listCenterX + 15; // Date starts here (Left-aligned)

      // Draw the scores
      topScores.forEach((scoreEntry: HighScore, index: number) => {
        // --- MODIFIED: Date formatting to exclude time and use 2-digit year ---
        const dateObj = new Date(scoreEntry.date);
        const dateString = dateObj.toLocaleDateString('en-US', {
          month: 'numeric', day: 'numeric', year: '2-digit' // Now 2-digit year
        });
        // ------------------------------------------------------------------------

        // Determine if this is the new score (it will be the first one in the list if tied)
        const isNewScore = (scoreEntry.score === score && index === 0);
        
        ctx.font = isNewScore ? 'bold 16px Inter, sans-serif' : '16px Inter, sans-serif';
        ctx.fillStyle = isNewScore ? '#2ecc71' : '#bdc3c7'; // Highlight new high score
        
        // Removed: Draw Rank (1-5) 
        // Original: ctx.fillText(`${index + 1}.`, rankRightX, listY);

        // Draw Score - R-aligned for column 1
        ctx.textAlign = 'right';
        ctx.fillText(scoreEntry.score.toString(), scoreRightX, listY);

        // Draw Date/Time (Now just Date) - L-aligned for column 2
        ctx.textAlign = 'left';
        ctx.fillText(dateString, dateLeftX, listY);

        listY += 20; // Space for the next line
      });

      // --- 4. BUTTONS (ALIGNED WITH diep.component.ts CLICK AREAS) ---
      const btnW = 160;
      const btnH = 45;
      const btnX = width / 2 - 80; // Common X for centering
      
      // REPLAY Button Y. Set to height / 2 + 60 to match click detection logic.
      const replayBtnY = height / 2 + 60; 

      // 1. Draw REPLAY Button
      ctx.fillStyle = '#e74c3c'; // Red color for the replay button
      ctx.fillRect(btnX, replayBtnY, btnW, btnH);

      ctx.strokeStyle = '#c0392b'; // Darker red border
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, replayBtnY, btnW, btnH);

      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('REPLAY', width / 2, replayBtnY + 30);

      // 2. Draw MAIN MENU Button
      // MAIN MENU Button Y. Set to height / 2 + 120 to match click detection logic.
      const menuBtnY = height / 2 + 120; 

      ctx.fillStyle = '#2c3e50'; // Dark blue/gray for the main menu button
      ctx.fillRect(btnX, menuBtnY, btnW, btnH);

      ctx.strokeStyle = '#34495e'; // Darker blue/gray border
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, menuBtnY, btnW, btnH);

      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('MAIN MENU', width / 2, menuBtnY + 30);

      // Return the bounding boxes for click detection
      return {
          replay: { x: btnX, y: replayBtnY, w: btnW, h: btnH },
          mainMenu: { x: btnX, y: menuBtnY, w: btnW, h: btnH }
      };
    }

    return null;
  }

  /**
   * Draws the Pause Menu overlay, including the RESUME and Dark Mode Toggle buttons.
   * @param state The current game state and canvas context.
   */
  public static drawPauseScreen(state: MenuState): void {
    const { ctx, width, height, isPaused, isDarkMode } = state;

    if (isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = 'bold 64px Inter, sans-serif';
      ctx.fillStyle = '#f39c12';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', width / 2, height / 2 - 100);

      // Draw RESUME Button (Center)
      const playBtnX = width / 2 - 80;
      const playBtnY = height / 2 - 40;
      const playBtnW = 160;
      const playBtnH = 45;

      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(playBtnX, playBtnY, playBtnW, playBtnH);
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('RESUME', width / 2, playBtnY + 30);

      // Draw Dark Mode Toggle Button (Below Resume)
      const toggleBtnW = 280; // Increased width for text
      const toggleBtnX = width / 2 - (toggleBtnW / 2); // Center it
      const toggleBtnY = height / 2 + 40;
      const toggleBtnH = 45;

      ctx.fillStyle = isDarkMode ? '#34495e' : '#ecf0f1'; // Color based on target mode
      ctx.fillRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);

      ctx.font = 'bold 18px Inter, sans-serif'; // Reduced font size
      ctx.fillStyle = isDarkMode ? '#ecf0f1' : '#333'; // Text color

      // Updated text for clarity
      const toggleText = isDarkMode ? 'CLICK FOR LIGHT MODE 🌞' : 'CLICK FOR DARK MODE 🌙';
      ctx.fillText(toggleText, width / 2, toggleBtnY + 30);
    }
  }

  /**
   * Draws the small in-game Pause/Play button at the top center.
   * @param state The current game state and canvas context.
   */
  public static drawInGamePauseButton(state: MenuState): void {
    const { ctx, width, gameOver, isPaused, isGameStarted } = state;

    // Only draw the button if the game is NOT over AND the game has started
    if (!gameOver && isGameStarted) {
      const btnRadius = 20;
      const btnX = width / 2; // Center
      const btnY = 35; // Top center

      ctx.fillStyle = 'rgba(52, 152, 219, 0.9)'; // Blue background
      ctx.beginPath();
      ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      if (isPaused) {
        // Draw Play icon (Triangle)
        ctx.beginPath();
        ctx.moveTo(btnX - 5, btnY - 8);
        ctx.lineTo(btnX - 5, btnY + 8);
        ctx.lineTo(btnX + 7, btnY);
        ctx.closePath();
        ctx.fill();
      } else {
        // Draw Pause icon (two vertical lines)
        ctx.fillRect(btnX - 6, btnY - 8, 4, 16);
        ctx.fillRect(btnX + 2, btnY - 8, 4, 16);
      }

      // Add a border when paused to make it stand out against the dark overlay
      if (isPaused) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }
}
