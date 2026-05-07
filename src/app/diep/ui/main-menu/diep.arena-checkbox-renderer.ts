import { TileType } from '../../engine/subsystems/diep.arena-manager';

export class DiepArenaCheckboxRenderer {
  private static readonly WARNING_DURATION = 1500;
  private static readonly HOLE_PERSIST_DURATION = 2000; // How long it stays black
  
  private static miniGrid = Array.from({ length: 9 }, () => ({
    type: TileType.EMPTY,
    targetType: TileType.EMPTY,
    transition: 0,
    warningTime: 0,
    life: 0 // Track how long the hazard has been active
  }));

  public static draw(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isEnabled: boolean, frame: number): void {
    const dt = 16; // Use standard 60fps delta
    const cellSize = size / 3;
    const padding = 2;

    this.miniGrid.forEach((tile, i) => {
      // 1. Logic Controller
      if (isEnabled) {
        // Only spawn new hazards if the tile is fully EMPTY
        if (tile.targetType === TileType.EMPTY && tile.transition === 0 && Math.random() > 0.997) {
          tile.targetType = Math.random() > 0.6 ? TileType.WALL : TileType.HOLE;
          tile.warningTime = 0;
          tile.life = 0;
        }

        // Handle expiration of hazards
        if (tile.targetType !== TileType.EMPTY) {
          tile.life += dt;
          // Walls expire after 3s, Holes expire after warning + persist duration
          const expiry = tile.targetType === TileType.WALL ? 3000 : (this.WARNING_DURATION + this.HOLE_PERSIST_DURATION);
          if (tile.life > expiry) {
            tile.targetType = TileType.EMPTY;
          }
        }
      } else {
        tile.targetType = TileType.EMPTY;
      }

      this.processTileLogic(tile, dt);

      // 2. Rendering
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cellX = x + col * cellSize + padding;
      const cellY = y + row * cellSize + padding;
      const drawSize = cellSize - (padding * 2);

      this.renderMiniTile(ctx, tile, cellX, cellY, drawSize);
    });
  }

  private static processTileLogic(tile: any, dt: number): void {
    const target = tile.targetType;
    const current = tile.type;

    if (target === TileType.HOLE) {
      if (current !== TileType.HOLE) {
        tile.warningTime += dt;
        if (tile.warningTime >= this.WARNING_DURATION) {
          tile.type = TileType.HOLE;
          tile.transition = 0;
        }
      } else if (tile.transition < 1) {
        tile.transition += dt * 0.001; // Slow lowering
      }
    } else if (target === TileType.WALL && tile.transition < 1) {
      tile.transition += dt * 0.002; // Faster raising
      if (tile.transition >= 1) {
        tile.type = TileType.WALL;
        tile.transition = 1;
      }
    } else if (target === TileType.EMPTY && tile.transition > 0) {
      tile.transition -= dt * 0.0015; // Specific fade-out speed
      if (tile.transition <= 0) {
        tile.transition = 0;
        tile.type = TileType.EMPTY;
        tile.warningTime = 0;
      }
    }
  }

  private static renderMiniTile(ctx: CanvasRenderingContext2D, tile: any, x: number, y: number, size: number): void {
    // Background ghost grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x, y, size, size);

    if (tile.targetType === TileType.HOLE && tile.type !== TileType.HOLE) {
      // Blinking Warning: Red to Grey
      const isBlinkOn = Math.floor(tile.warningTime / 250) % 2 === 0;
      ctx.fillStyle = isBlinkOn ? 'rgba(231, 76, 60, 0.4)' : 'rgba(255, 255, 255, 0.1)';
    } else if (tile.type === TileType.HOLE) {
      // Solid Black Hole (Opacity tied to transition)
      ctx.fillStyle = `rgba(0, 0, 0, ${tile.transition * 0.9})`;
    } else if (tile.targetType === TileType.WALL || tile.type === TileType.WALL) {
      // White Wall
      ctx.fillStyle = `rgba(255, 255, 255, ${tile.transition * 0.8})`;
    } else if (tile.transition > 0) {
      // This handles the "Fade back to gray" state when target is EMPTY but transition > 0
      ctx.fillStyle = `rgba(255, 255, 255, ${tile.transition * 0.15})`;
    }

    ctx.fillRect(x, y, size, size);
  }
}