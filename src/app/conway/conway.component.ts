import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';

@Component({
  selector: 'app-conway',
  templateUrl: './conway.component.html',
  styleUrls: ['./conway.component.css'],
  standalone: true
})
export class ConwayComponent implements AfterViewInit, OnDestroy {
  // Reference to the canvas element in the template
  @ViewChild('gameCanvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D; // 2D drawing context for the canvas

  // Grid and display configuration
  private CELL_SIZE!: number; // Size of each cell in pixels (computed dynamically)
  private GRID_WIDTH = 25;    // Number of columns in the grid
  private GRID_HEIGHT = 25;   // Number of rows in the grid
  private BORDER_THICKNESS = 20; // Thickness of the canvas border in pixels

  // Simulation grid: 2D array of 0/1 values representing cell state (dead/alive)
  private grid: number[][] = [];

  running = false; // Whether the simulation is running
  private animationFrameId: any; // ID for the animation frame loop (used to stop loop)
  simulationInterval: number = 200; // ms between generations (calculated from speed slider)
  currentGenerationsPerSecond: number = 5; // UI slider value: how many generations per second
  private lastUpdateTime = 0; // Used to keep simulation in sync with UI speed

  // UI message display
  messageBoxText: string = "Click on cells to toggle them, then press Start!";
  messageBoxClass: string = "p-3 bg-blue-100 text-blue-800 rounded-md text-sm w-full text-center";

  // Drag-to-draw functionality
  isDragging: boolean = false;
  private boundHandleMouseDown: ((event: MouseEvent) => void) | null = null;
  private boundHandleMouseMove: ((event: MouseEvent) => void) | null = null;
  private boundHandleMouseUp: ((event: MouseEvent) => void) | null = null;

  /**
   * Angular lifecycle hook: called after component's view (canvas) is initialized.
   * Sets up the Game of Life grid, canvas, and listeners.
   */
  ngAfterViewInit(): void {
    this.initializeGameOfLife();
  }

  /**
   * Angular lifecycle hook: called before the component is destroyed.
   * Cleans up animation and event listeners.
   */
  ngOnDestroy(): void {
    this.stopSimulation();
    this.removeCanvasMouseDownListener();
    this.removeGlobalMouseListeners();
  }

  /**
   * Initializes the Game of Life grid, canvas, and sets up the UI.
   * Called on load and when resizing or clearing.
   */
  private initializeGameOfLife(): void {
    if (this.canvasRef && this.canvasRef.nativeElement) {
      // Set up 2D drawing context
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      const canvasElement = this.canvasRef.nativeElement;
      const containerWidth = canvasElement.parentElement!.clientWidth;
      const availableContainerPadding = 24 * 2; // Tailwind .p-6 = 24px x2
      const maxAllowedWidth = 800;

      // Compute the largest cell size that will fit in the container
      const targetCanvasDimension = Math.min(
        containerWidth - availableContainerPadding - (this.BORDER_THICKNESS * 2),
        maxAllowedWidth - (this.BORDER_THICKNESS * 2)
      );
      this.CELL_SIZE = Math.floor(targetCanvasDimension / this.GRID_WIDTH);

      // Set canvas dimensions for crisp rendering
      canvasElement.width = this.CELL_SIZE * this.GRID_WIDTH;
      canvasElement.height = this.CELL_SIZE * this.GRID_HEIGHT;

      // Initialize a blank grid (all cells dead)
      this.grid = Array(this.GRID_HEIGHT).fill(0).map(() => Array(this.GRID_WIDTH).fill(0));
      this.drawGrid();
      this.showMessage("Grid initialized. Click/drag to draw, then press Start!");

      // Set up mouse event for drawing
      this.addCanvasMouseDownListener();

      // Initialize simulation interval (speed)
      this.simulationInterval = 1000 / this.currentGenerationsPerSecond;

      // Sync the slider UI to the correct value
      const speedSliderElement = document.getElementById('speedSlider') as HTMLInputElement;
      if (speedSliderElement) {
        speedSliderElement.value = this.currentGenerationsPerSecond.toString();
      }
    } else {
      console.warn('Canvas element not found for Game of Life initialization.');
    }
  }

  /**
   * Utility: Display a message in the UI with different color classes.
   * @param msg The message to display
   * @param type 'info' | 'success' | 'error' (controls color)
   */
  private showMessage(msg: string, type: 'info' | 'success' | 'error' = 'info'): void {
    this.messageBoxText = msg;
    let baseClass = 'p-3 rounded-md text-sm w-full text-center';
    if (type === 'info') {
      this.messageBoxClass = `${baseClass} bg-blue-100 text-blue-800`;
    } else if (type === 'success') {
      this.messageBoxClass = `${baseClass} bg-green-100 text-green-800`;
    } else if (type === 'error') {
      this.messageBoxClass = `${baseClass} bg-red-100 text-red-800`;
    }
  }

  /**
   * Draws the current grid state to the canvas.
   * Live cells are filled; dead cells are outlined.
   */
  private drawGrid(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvasRef!.nativeElement.width, this.canvasRef!.nativeElement.height);

    for (let row = 0; row < this.GRID_HEIGHT; row++) {
      for (let col = 0; col < this.GRID_WIDTH; col++) {
        const x = col * this.CELL_SIZE;
        const y = row * this.CELL_SIZE;
        if (this.grid[row][col] === 1) {
          this.ctx.fillStyle = '#3b82f6'; // Alive cell: blue
          this.ctx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
        } else {
          this.ctx.strokeStyle = '#e5e7eb'; // Dead cell: light gray border
          this.ctx.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
        }
      }
    }
  }

  /**
   * Computes the next state of the grid based on Conway's Game of Life rules.
   * Applies rules to each cell and updates the grid.
   */
  private getNextGeneration(): void {
    const newGrid = Array(this.GRID_HEIGHT).fill(0).map(() => Array(this.GRID_WIDTH).fill(0));
    for (let row = 0; row < this.GRID_HEIGHT; row++) {
      for (let col = 0; col < this.GRID_WIDTH; col++) {
        const cell = this.grid[row][col];
        let liveNeighbors = 0;
        // Count live neighbors
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const neighborRow = row + i;
            const neighborCol = col + j;
            if (
              neighborRow >= 0 && neighborRow < this.GRID_HEIGHT &&
              neighborCol >= 0 && neighborCol < this.GRID_WIDTH
            ) {
              liveNeighbors += this.grid[neighborRow][neighborCol];
            }
          }
        }
        // Apply Conway's rules
        if (cell === 1 && (liveNeighbors < 2 || liveNeighbors > 3)) {
          newGrid[row][col] = 0; // Cell dies
        } else if (cell === 0 && liveNeighbors === 3) {
          newGrid[row][col] = 1; // Cell is born
        } else {
          newGrid[row][col] = cell; // No change
        }
      }
    }
    this.grid = newGrid;
  }

  /**
   * Animation loop: advances simulation and draws grid at the correct speed.
   * Uses requestAnimationFrame for smooth visuals and timing.
   */
  private animate(currentTime: DOMHighResTimeStamp): void {
    if (!this.running) {
      cancelAnimationFrame(this.animationFrameId);
      return;
    }
    // Advance a generation when enough time has passed
    if (currentTime - this.lastUpdateTime >= this.simulationInterval) {
      this.getNextGeneration();
      this.drawGrid();
      this.lastUpdateTime = currentTime;
    }
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }

  /** Start the simulation when Start is clicked */
  onStart(): void {
    if (!this.running) {
      this.running = true;
      this.showMessage("Simulation started!", 'success');
      this.lastUpdateTime = performance.now();
      this.animate(performance.now());
    }
  }

  /** Stop the simulation when Stop is clicked */
  onStop(): void {
    this.stopSimulation();
  }

  /** Internal: Stop the simulation and the animation loop */
  private stopSimulation(): void {
    if (this.running) {
      this.running = false;
      this.showMessage("Simulation stopped.", 'info');
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /** Clear button: resets the grid to all dead cells and redraws */
  onClear(): void {
    this.stopSimulation();
    if (this.canvasRef && this.canvasRef.nativeElement) {
      this.initializeGameOfLife();
    } else {
      this.grid = Array(this.GRID_HEIGHT).fill(0).map(() => Array(this.GRID_WIDTH).fill(0));
      this.showMessage("Grid cleared. Draw new patterns or randomize.");
    }
  }

  /** Randomize button: fills the grid with random live/dead cells */
  onRandomize(): void {
    this.stopSimulation();
    if (this.grid && this.GRID_HEIGHT && this.GRID_WIDTH) {
      for (let row = 0; row < this.GRID_HEIGHT; row++) {
        for (let col = 0; col < this.GRID_WIDTH; col++) {
          this.grid[row][col] = Math.random() > 0.7 ? 1 : 0; // 30% chance cell is alive
        }
      }
      this.drawGrid();
      this.showMessage("Grid randomized! Press Start to see it evolve.");
    }
  }

  /**
   * Adds a mousedown listener to the canvas for starting drag-to-draw.
   */
  private addCanvasMouseDownListener(): void {
    const canvasElement = this.canvasRef?.nativeElement;
    if (canvasElement) {
      if (this.boundHandleMouseDown) {
        canvasElement.removeEventListener('mousedown', this.boundHandleMouseDown);
      }
      this.boundHandleMouseDown = this.handleMouseDown.bind(this);
      canvasElement.addEventListener('mousedown', this.boundHandleMouseDown);
    }
  }

  /**
   * Removes mousedown listener from the canvas.
   */
  private removeCanvasMouseDownListener(): void {
    const canvasElement = this.canvasRef?.nativeElement;
    if (canvasElement && this.boundHandleMouseDown) {
      canvasElement.removeEventListener('mousedown', this.boundHandleMouseDown);
      this.boundHandleMouseDown = null;
    }
  }

  /**
   * Adds global mousemove/mouseup listeners for drag-to-draw functionality.
   */
  private addGlobalMouseListeners(): void {
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    document.addEventListener('mousemove', this.boundHandleMouseMove);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
  }

  /**
   * Removes global drag listeners (mousemove/mouseup).
   */
  private removeGlobalMouseListeners(): void {
    if (this.boundHandleMouseMove) {
      document.removeEventListener('mousemove', this.boundHandleMouseMove);
      this.boundHandleMouseMove = null;
    }
    if (this.boundHandleMouseUp) {
      document.removeEventListener('mouseup', this.boundHandleMouseUp);
      this.boundHandleMouseUp = null;
    }
  }

  /**
   * Handler for mousedown on the canvas: begins drag-to-draw.
   */
  private handleMouseDown(event: MouseEvent): void {
    if (this.running) return; // Disable drawing while running
    this.isDragging = true;
    this.addGlobalMouseListeners();
    this.processMouseCoordinates(event);
  }

  /**
   * Handler for mousemove during a drag: continues drawing cells.
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.running) return;
    this.processMouseCoordinates(event);
  }

  /**
   * Handler for mouseup: ends drag-to-draw.
   */
  private handleMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    this.removeGlobalMouseListeners();
    this.showMessage("Drawing complete. Press Start to see it evolve.");
  }

  /**
   * Calculates which cell the mouse is over and turns it on (when drawing).
   * @param event Mouse event with coordinates
   */
  private processMouseCoordinates(event: MouseEvent): void {
    const canvasElement = this.canvasRef!.nativeElement;
    const rect = canvasElement.getBoundingClientRect();
    const drawableWidthCSS = rect.width - (this.BORDER_THICKNESS * 2);
    const drawableHeightCSS = rect.height - (this.BORDER_THICKNESS * 2);
    const scaleX = canvasElement.width / drawableWidthCSS;
    const scaleY = canvasElement.height / drawableHeightCSS;
    // mouseX/Y: coordinates relative to drawable area (inside the border)
    const mouseX = (event.clientX - rect.left - this.BORDER_THICKNESS) * scaleX;
    const mouseY = (event.clientY - rect.top - this.BORDER_THICKNESS) * scaleY;
    const col = Math.floor(mouseX / this.CELL_SIZE);
    const row = Math.floor(mouseY / this.CELL_SIZE);
    if (row >= 0 && row < this.GRID_HEIGHT && col >= 0 && col < this.GRID_WIDTH && !this.running) {
      if (this.grid[row][col] === 0) {
        this.grid[row][col] = 1;
        this.drawGrid();
      }
    }
  }

  /**
   * Updates simulation speed when slider is changed.
   * @param event Input event from slider
   */
  onSpeedChange(event: Event): void {
    this.currentGenerationsPerSecond = parseInt((event.target as HTMLInputElement).value);
    this.simulationInterval = 1000 / this.currentGenerationsPerSecond;
    this.showMessage(`Speed: ${this.currentGenerationsPerSecond} generations/second`, 'info');
    if (this.running) {
      cancelAnimationFrame(this.animationFrameId);
      this.lastUpdateTime = performance.now();
      this.animate(performance.now());
    }
  }

  /**
   * Window resize event: reinitializes grid/canvas so it stays responsive.
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.canvasRef?.nativeElement) {
      const canvasElement = this.canvasRef.nativeElement;
      const currentContainerWidth = canvasElement.parentElement!.clientWidth;
      const availableContainerPadding = 24 * 2;
      const newAvailableWidth = currentContainerWidth - availableContainerPadding - (this.BORDER_THICKNESS * 2);
      const currentDrawingWidth = canvasElement.width;
      if (currentDrawingWidth !== Math.min(newAvailableWidth, 800 - (this.BORDER_THICKNESS * 2))) {
        this.initializeGameOfLife();
        if (this.running) {
          this.stopSimulation();
          this.showMessage("Resized: Simulation stopped. Press Start to continue.");
        } else {
          this.showMessage("Resized: Grid adjusted.");
        }
      }
    }
  }
}