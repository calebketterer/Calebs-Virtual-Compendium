import { Injectable } from '@angular/core';

export enum TileType {
  EMPTY = 'EMPTY',
  HOLE = 'HOLE',
  WALL = 'WALL'
}

export interface ArenaTile {
  type: TileType;
  targetType: TileType;
  transition: number; // 0 to 1
  x: number;
  y: number;
  warningTime: number; // For the blinking warning
}

@Injectable({ providedIn: 'root' })
export class DiepArenaManager {
  public readonly tileSize = 50;
  private grid: Map<string, ArenaTile> = new Map();
  private columns: number = 0;
  private rows: number = 0;

  // 1500ms allows for 3 distinct blinks at 500ms intervals
  private readonly WARNING_DURATION = 1500;

  public init(width: number, height: number): void {
    this.columns = Math.ceil(width / this.tileSize);
    this.rows = Math.ceil(height / this.tileSize);
    this.grid.clear();
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        const key = `${x},${y}`;
        this.grid.set(key, { 
          type: TileType.EMPTY, 
          targetType: TileType.EMPTY, 
          transition: 0, 
          x, 
          y,
          warningTime: 0 
        });
      }
    }
  }

  public update(deltaTime: number): void {
    this.grid.forEach(tile => {
      // Use 'as any' for comparisons to avoid TS "no overlap" errors during build
      const target = tile.targetType as any;
      const current = tile.type as any;

      // HANDLE HOLE WARNING & LOWERING
      if (target === TileType.HOLE) {
        if (current !== TileType.HOLE) {
          if (tile.warningTime < this.WARNING_DURATION) {
            tile.warningTime += deltaTime;
          } else {
            // After warning, start lowering
            tile.type = TileType.HOLE;
            tile.transition = 0;
          }
        } else if (tile.transition < 1) {
          // Slow lowering transition
          tile.transition += deltaTime * 0.001; 
          if (tile.transition > 1) tile.transition = 1;
        }
      } 
      // HANDLE WALL RAISING
      else if (target === TileType.WALL && tile.transition < 1) {
        tile.transition += deltaTime * 0.002;
        if (tile.transition >= 1) {
          tile.type = TileType.WALL;
          tile.transition = 1;
        }
      }
      // HANDLE CLEARING/FADING OUT
      else if (target === TileType.EMPTY && tile.transition > 0) {
        tile.transition -= deltaTime * 0.0015;
        if (tile.transition <= 0) {
          tile.transition = 0;
          tile.type = TileType.EMPTY;
          tile.warningTime = 0;
        }
      }
    });
  }

  /**
   * RESTORED: Resets all tiles to empty target for director cleanup
   */
  public clearAll(): void {
    this.grid.forEach(tile => {
      tile.targetType = TileType.EMPTY;
    });
  }

  public triggerHazard(x: number, y: number, type: TileType): void {
    const gridX = Math.floor(x / this.tileSize);
    const gridY = Math.floor(y / this.tileSize);
    const tile = this.grid.get(`${gridX},${gridY}`);
    if (tile) {
      tile.targetType = type;
      tile.warningTime = 0; // Reset warning for new hazards
    }
  }

  public getTileAt(worldX: number, worldY: number): ArenaTile | undefined {
    const x = Math.floor(worldX / this.tileSize);
    const y = Math.floor(worldY / this.tileSize);
    return this.grid.get(`${x},${y}`);
  }

  public getAllTiles(): ArenaTile[] {
    return Array.from(this.grid.values());
  }
}