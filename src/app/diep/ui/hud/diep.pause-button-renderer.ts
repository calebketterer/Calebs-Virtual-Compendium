export class DiepPauseButtonRenderer {
  public static draw(ctx: CanvasRenderingContext2D, g: any, width: number): void {
    // Only draw if the game is active
    if (g.gameOver || !g.isGameStarted) return;

    const btnRadius = 20;
    const btnX = width / 2;
    const btnY = 35;

    // Button Circle
    ctx.fillStyle = 'rgba(52, 152, 219, 0.9)';
    ctx.beginPath();
    ctx.arc(btnX, btnY, btnRadius, 0, Math.PI * 2);
    ctx.fill();

    // Icon (Play triangle or Pause bars)
    ctx.fillStyle = '#fff';
    if (g.isPaused) {
      ctx.beginPath();
      ctx.moveTo(btnX - 5, btnY - 8);
      ctx.lineTo(btnX - 5, btnY + 8);
      ctx.lineTo(btnX + 7, btnY);
      ctx.fill();
    } else {
      ctx.fillRect(btnX - 6, btnY - 8, 4, 16);
      ctx.fillRect(btnX + 2, btnY - 8, 4, 16);
    }
  }
}