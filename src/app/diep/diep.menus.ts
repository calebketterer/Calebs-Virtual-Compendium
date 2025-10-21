import { HighScore } from './diep.interfaces';

/**
 * diep.menus.ts
 *
 * Provides functions for drawing various UI elements, menus, and overlays onto the canvas context.
 *
 * NOTE: Button drawing logic is now static and does not depend on hover state.
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
  topScores: HighScore[]; // Array of saved high scores for display
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
   * Helper function to draw the standardized high score list in two columns (Score and Date).
   * This function is reused by both the Game Over and Pause screens.
   * @param ctx The canvas rendering context.
   * @param listCenterX The X coordinate for the center of the list title/columns.
   * @param listTitleY The Y coordinate for the list title.
   * @param topScores The array of high scores to display.
   * @param highlightScore The score to highlight (if applicable, typically null for pause screen).
   * @param titleColor The color for the "HIGH SCORES" title.
   */
  private static drawHighScoreList(
    ctx: CanvasRenderingContext2D,
    listCenterX: number,
    listTitleY: number,
    topScores: HighScore[],
    highlightScore: number | null,
    titleColor: string
  ): void {
    // Title
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORES', listCenterX, listTitleY);

    // Starting Y position for the first score list element
    let listY = listTitleY + 35;

    // Check if there are any scores to display
    if (topScores.length === 0) {
      ctx.font = '16px Inter, sans-serif';
      ctx.fillStyle = '#bdc3c7'; // Light grey text for 'No Scores Yet'
      ctx.textAlign = 'center';
      ctx.fillText('No Scores Yet', listCenterX, listY);
    } else {
      // Define column X positions relative to listCenterX for cleaner separation
      const scoreRightX = listCenterX - 15; // Score ends here (Right-aligned)
      const dateLeftX = listCenterX + 15; // Date starts here (Left-aligned)

      // Draw the scores
      topScores.forEach((scoreEntry: HighScore) => {
        const dateObj = new Date(scoreEntry.date);
        const dateString = dateObj.toLocaleDateString('en-US', {
          month: 'numeric', day: 'numeric', year: '2-digit'
        });

        // --- FIX APPLIED HERE ---
        // A score is highlighted if it matches the current game's final score (highlightScore).
        // The index constraint is removed, so any new score is highlighted.
        const isHighlighted = (highlightScore !== null && scoreEntry.score === highlightScore);

        // Apply user's requested colors: Gold for new score, White for old scores.
        const newScoreColor = '#FFD700'; // Gold
        const oldScoreColor = '#FFF';    // White
        
        const scoreColor = isHighlighted ? newScoreColor : oldScoreColor;

        // Apply larger/bold font for new score for better visibility.
        ctx.font = isHighlighted ? 'bold 20px Inter, sans-serif' : 'bold 16px Inter, sans-serif';
        ctx.fillStyle = scoreColor; // Apply color

        // Draw Score - R-aligned for column 1
        ctx.textAlign = 'right';
        ctx.fillText(scoreEntry.score.toString(), scoreRightX, listY);

        // Draw Date - L-aligned for column 2
        ctx.textAlign = 'left';
        ctx.fillText(dateString, dateLeftX, listY);

        listY += 25; // Increased space for the new 20px font
      });
    }

    // Restore textAlign to center
    ctx.textAlign = 'center';
  }

  /**
   * Draws the Start Menu overlay screen, including the game title and the START button.
   * This screen is shown when the game has not yet started.
   * @param state The current game state and canvas context.
   * @returns The clickable area of the START button.
   */
  public static drawStartMenu(state: MenuState): ButtonArea | null {
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

      // Draw START Button (Static drawing logic restored)
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

      // Return the area for click detection
      return { x: btnX, y: btnY, w: btnW, h: btnH };
    }

    return null;
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
      ctx.font = 'bold 64px Inter, sans-serif';
      ctx.fillStyle = '#f1c40f'; // Yellow color
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

      // --- 2. FINAL SCORE (CENTERED AND HIGH) ---
      ctx.font = '32px Inter, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 10);

      // --- 3. HIGH SCORES LIST (RIGHT SIDE QUADRANT) ---

      const hsListXRatio = 0.875;
      const listCenterX = width * hsListXRatio;
      let listTitleY = height / 2 - 200;

      // Use the reusable helper function
      DiepMenus.drawHighScoreList(
        ctx,
        listCenterX,
        listTitleY,
        topScores,
        score, // Pass current score for highlighting
        '#3498db' // Blue title color
      );

      // --- 4. BUTTONS ---
      const btnW = 160;
      const btnH = 45;
      const btnX = width / 2 - 80; // Common X for centering

      // 1. REPLAY Button
      const replayBtnY = height / 2 + 60;
      
      ctx.fillStyle = '#e74c3c'; // Red color for the replay button
      ctx.fillRect(btnX, replayBtnY, btnW, btnH);

      ctx.strokeStyle = '#c0392b'; // Darker red border
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, replayBtnY, btnW, btnH);

      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('REPLAY', width / 2, replayBtnY + 30);

      // 2. MAIN MENU Button
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
    const { ctx, width, height, isPaused, isDarkMode, topScores } = state;

    if (isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, width, height);

      // --- 1. PAUSED TITLE (CENTERED) ---
      ctx.font = 'bold 64px Inter, sans-serif';
      ctx.fillStyle = '#f39c12';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', width / 2, height / 2 - 100);

      // --- 2. RESUME Button ---
      const playBtnW = 160;
      const playBtnH = 45;
      const playBtnX = width / 2 - (playBtnW / 2);
      const playBtnY = height / 2 - 40;

      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(playBtnX, playBtnY, playBtnW, playBtnH);
      
      ctx.strokeStyle = '#27ae60'; // Border
      ctx.lineWidth = 3;
      ctx.strokeRect(playBtnX, playBtnY, playBtnW, playBtnH);

      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('RESUME', width / 2, playBtnY + 30);

      // --- 3. Dark Mode Toggle Button ---
      const toggleBtnW = 280; // Increased width for text
      const toggleBtnH = 45;
      const toggleBtnX = width / 2 - (toggleBtnW / 2); // Center it
      const toggleBtnY = height / 2 + 40;

      ctx.fillStyle = isDarkMode ? '#34495e' : '#ecf0f1'; // Color based on target mode
      ctx.fillRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);
      
      ctx.strokeStyle = isDarkMode ? '#2c3e50' : '#bdc3c7'; // Border
      ctx.lineWidth = 2;
      ctx.strokeRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH);

      ctx.font = 'bold 18px Inter, sans-serif'; // Reduced font size
      ctx.fillStyle = isDarkMode ? '#ecf0f1' : '#333'; // Text color

      // Updated text for clarity
      const toggleText = isDarkMode ? 'CLICK FOR LIGHT MODE 🌞' : 'CLICK FOR DARK MODE 🌙';
      ctx.fillText(toggleText, width / 2, toggleBtnY + 30);

      // --- 4. HIGH SCORES LIST (Right side quadrant) ---

      const hsListXRatio = 0.875;
      const listCenterX = width * hsListXRatio;
      let listTitleY = height / 2 - 200;

      // Use the reusable helper function
      DiepMenus.drawHighScoreList(
        ctx,
        listCenterX,
        listTitleY,
        topScores,
        null, // No highlighting on pause screen
        '#f39c12' // Yellow title color
      );

      // Restore textAlign to center for general drawing
      ctx.textAlign = 'center';
    }
  }

  /**
   * Draws the small in-game Pause/Play button at the top center.
   * @param state The current game state and canvas context.
   * @returns The clickable area of the button.
   */
  public static drawInGamePauseButton(state: MenuState): ButtonArea | null {
    const { ctx, width, gameOver, isPaused, isGameStarted } = state;

    // Only draw the button if the game is NOT over AND the game has started
    if (!gameOver && isGameStarted) {
      const btnRadius = 20;
      const btnX = width / 2; // Center
      const btnY = 35; // Top center
      const btnArea: ButtonArea = { x: btnX - btnRadius, y: btnY - btnRadius, w: btnRadius * 2, h: btnRadius * 2 };

      // Draw the button body
      ctx.fillStyle = 'rgba(52, 152, 219, 0.9)'; // Blue background
      ctx.beginPath();
      ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw Icon
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
      return btnArea;
    }
    return null;
  }
}
