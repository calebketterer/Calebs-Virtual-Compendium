// Define an interface to enforce which game state variables are required for drawing the menus.
interface MenuState {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  isGameStarted: boolean; // <-- NEW: State to determine if the game is active or still on the start screen
  gameOver: boolean;
  isPaused: boolean;
  score: number;
  isDarkMode: boolean;
  deathAnimationTimeStart: number | null;
}

/**
 * Utility class containing all methods responsible for drawing
 * UI elements, menus, and overlays onto the canvas context.
 */
export class DiepMenus {

  /**
   * Draws the Start Menu overlay screen, including the game title and the START button.
   * @param state The current game state and canvas context.
   */
  public static drawStartMenu(state: MenuState): void {
    const { ctx, width, height, isGameStarted } = state;

    // Only draw if the game has not started
    if (!isGameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Dark overlay
      ctx.fillRect(0, 0, width, height);

      // Game Title
      ctx.font = 'bold 80px Inter, sans-serif';
      ctx.fillStyle = '#3498db'; // Blue color for the main title
      ctx.textAlign = 'center';
      ctx.fillText('Diep Singleplayer', width / 2, height / 2 - 120);

      // Instructions/Motto
      ctx.font = 'italic bold 20px Inter, sans-serif';
      ctx.fillStyle = '#bdc3c7'; // Light grey secondary text
      ctx.fillText('Shape Warfare: Destroy Shapes, Dodge Enemies, Dominate', width / 2, height / 2 - 60);

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
   * Draws the Game Over overlay screen, including the final score and the Replay button.
   */
  public static drawGameOverScreen(state: MenuState): void {
    // Note: isGameStarted is not destructured here but is part of the state for consistency
    const { ctx, width, height, gameOver, deathAnimationTimeStart, score } = state;

    // Only draw if the game is over and the death animation has finished/not started
    if (gameOver && deathAnimationTimeStart === null) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = 'bold 64px Inter, sans-serif';
      ctx.fillStyle = '#f1c40f';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height / 2 - 40);

      ctx.font = '32px Inter, sans-serif';
      ctx.fillStyle = '#ecf0f1';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 10);

      // Draw Replay Button
      const btnX = width / 2 - 80;
      const btnY = height / 2 + 60;
      const btnW = 160;
      const btnH = 45;

      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(btnX, btnY, btnW, btnH);

      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 3;
      ctx.strokeRect(btnX, btnY, btnW, btnH);

      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('REPLAY', width / 2, btnY + 30);
    }
  }

  /**
   * Draws the Pause Menu overlay, including the RESUME and Dark Mode Toggle buttons.
   */
  public static drawPauseScreen(state: MenuState): void {
    // Note: isGameStarted is not destructured here but is part of the state for consistency
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
