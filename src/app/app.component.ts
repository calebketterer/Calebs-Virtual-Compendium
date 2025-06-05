import { Component, AfterViewInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CommonModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit, OnDestroy {
    title = 'ExampleWebsite'; // Original title

    // --- Conway's Game of Life Properties ---
    @ViewChild('gameCanvas', { static: false }) canvasRef?: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;

    private CELL_SIZE!: number; // Will be calculated dynamically
    private GRID_WIDTH = 25; // Desired grid width
    private GRID_HEIGHT = 25; // Desired grid height
    private BORDER_THICKNESS = 20; // Must match the border in app.component.css

    private grid: number[][] = [];
    running = false;
    private animationFrameId: any;
    simulationInterval: number = 200; // Default interval (lower means faster)
    currentGenerationsPerSecond: number = 5; // Default speed: 5 generations/second
    private lastUpdateTime = 0;

    messageBoxText: string = "Click on cells to toggle them, then press Start!";
    messageBoxClass: string = "p-3 bg-blue-100 text-blue-800 rounded-md text-sm w-full text-center";

    // New properties for drag functionality
    isDragging: boolean = false;
    private boundHandleMouseDown: ((event: MouseEvent) => void) | null = null;
    private boundHandleMouseMove: ((event: MouseEvent) => void) | null = null;
    private boundHandleMouseUp: ((event: MouseEvent) => void) | null = null;

    // New property for info popup visibility
    showInfoPopup: boolean = false;

    constructor() { }

    /**
     * Angular lifecycle hook: Called after Angular has initialized all of the component's view.
     * We initialize the Game of Life here directly since it's always visible now.
     */
    ngAfterViewInit(): void {
        this.initializeGameOfLife();
    }

    /**
     * Angular lifecycle hook: Called once, before the instance is destroyed.
     * Ensures the simulation stops and listeners are cleaned up to prevent memory leaks.
     */
    ngOnDestroy(): void {
        this.stopSimulation();
        this.removeCanvasMouseDownListener(); // Clean up only mousedown
        this.removeGlobalMouseListeners(); // Ensure global listeners are removed
    }

    /**
     * Initializes the Game of Life canvas and grid.
     * This method is called directly on component initialization.
     */
    private initializeGameOfLife(): void {
        if (this.canvasRef && this.canvasRef.nativeElement) {
            this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
            const canvasElement = this.canvasRef.nativeElement;
            const containerWidth = canvasElement.parentElement!.clientWidth;

            // Set canvas dimensions based on container, ensuring responsiveness
            // We need to account for the border thickness AND parent padding (p-6)
            const availableContainerPadding = 24 * 2; // p-6 on the parent div adds 24px padding on each side
            const maxAllowedWidth = 800; // Max width for the entire widget

            // Calculate the actual drawing area size
            const targetCanvasDimension = Math.min(
                containerWidth - availableContainerPadding - (this.BORDER_THICKNESS * 2),
                maxAllowedWidth - (this.BORDER_THICKNESS * 2)
            );

            // Calculate CELL_SIZE based on desired GRID_WIDTH (25) and target drawing dimension
            this.CELL_SIZE = Math.floor(targetCanvasDimension / this.GRID_WIDTH);

            // Set the canvas attributes (drawing buffer size) to be exact multiples of CELL_SIZE
            canvasElement.width = this.CELL_SIZE * this.GRID_WIDTH;
            canvasElement.height = this.CELL_SIZE * this.GRID_HEIGHT;

            this.grid = Array(this.GRID_HEIGHT).fill(0).map(() => Array(this.GRID_WIDTH).fill(0));
            this.drawGrid();
            this.showMessage("Grid initialized. Click/drag to draw, then press Start!");

            this.addCanvasMouseDownListener(); // Add mousedown listener to the canvas

            // Initialize simulationInterval based on currentGenerationsPerSecond
            this.simulationInterval = 1000 / this.currentGenerationsPerSecond;

            // Ensure the speed slider value matches the initial currentGenerationsPerSecond
            const speedSliderElement = document.getElementById('speedSlider') as HTMLInputElement;
            if (speedSliderElement) {
                speedSliderElement.value = this.currentGenerationsPerSecond.toString();
            }
        } else {
            console.warn('Canvas element not found for Game of Life initialization. This might happen during fast rendering.');
        }
    }

    // --- Helper Function for Messages ---
    private showMessage(msg: string, type: 'info' | 'success' | 'error' = 'info'): void {
        this.messageBoxText = msg;
        let baseClass = 'p-3 rounded-md text-sm w-full text-center';
        // Note: Tailwind text color classes are here, but CSS will override with !important for white.
        if (type === 'info') {
            this.messageBoxClass = `${baseClass} bg-blue-100 text-blue-800`;
        } else if (type === 'success') {
            this.messageBoxClass = `${baseClass} bg-green-100 text-green-800`;
        } else if (type === 'error') {
            this.messageBoxClass = `${baseClass} bg-red-100 text-red-800`;
        }
    }

    // --- Drawing Functions ---
    private drawGrid(): void {
        if (!this.ctx) return; // Ensure context exists
        this.ctx.clearRect(0, 0, this.canvasRef!.nativeElement.width, this.canvasRef!.nativeElement.height);

        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                const x = col * this.CELL_SIZE;
                const y = row * this.CELL_SIZE;

                if (this.grid[row][col] === 1) {
                    this.ctx.fillStyle = '#3b82f6';
                    this.ctx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                } else {
                    this.ctx.strokeStyle = '#e5e7eb';
                    this.ctx.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
                }
            }
        }
    }

    // --- Game Logic: Apply Conway's Rules ---
    private getNextGeneration(): void {
        const newGrid = Array(this.GRID_HEIGHT).fill(0).map(() => Array(this.GRID_WIDTH).fill(0));

        for (let row = 0; row < this.GRID_HEIGHT; row++) {
            for (let col = 0; col < this.GRID_WIDTH; col++) {
                const cell = this.grid[row][col];
                let liveNeighbors = 0;

                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;

                        const neighborRow = row + i;
                        const neighborCol = col + j;

                        if (neighborRow >= 0 && neighborRow < this.GRID_HEIGHT &&
                            neighborCol >= 0 && neighborCol < this.GRID_WIDTH) {
                            liveNeighbors += this.grid[neighborRow][neighborCol];
                        }
                    }
                }

                if (cell === 1 && (liveNeighbors < 2 || liveNeighbors > 3)) {
                    newGrid[row][col] = 0;
                } else if (cell === 0 && liveNeighbors === 3) {
                    newGrid[row][col] = 1;
                } else {
                    newGrid[row][col] = cell;
                }
            }
        }
        this.grid = newGrid;
    }

    // --- Animation Loop ---
    private animate(currentTime: DOMHighResTimeStamp): void {
        if (!this.running) {
            cancelAnimationFrame(this.animationFrameId);
            return;
        }

        if (currentTime - this.lastUpdateTime >= this.simulationInterval) {
            this.getNextGeneration();
            this.drawGrid();
            this.lastUpdateTime = currentTime;
        }

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    // --- Game Control Methods (Called from HTML template) ---

    onStart(): void {
        if (!this.running) {
            this.running = true;
            this.showMessage("Simulation started!", 'success');
            this.lastUpdateTime = performance.now();
            this.animate(performance.now());
        }
    }

    onStop(): void {
        this.stopSimulation();
    }

    private stopSimulation(): void {
        if (this.running) {
            this.running = false;
            this.showMessage("Simulation stopped.", 'info');
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    onClear(): void {
        this.stopSimulation();
        if (this.canvasRef && this.canvasRef.nativeElement) {
            this.initializeGameOfLife(); // Re-initialize to an empty grid
        }
        this.showMessage("Grid cleared. Draw new patterns or randomize.");
    }

    onRandomize(): void {
        this.stopSimulation();
        if (this.grid && this.GRID_HEIGHT && this.GRID_WIDTH) {
            for (let row = 0; row < this.GRID_HEIGHT; row++) {
                for (let col = 0; col < this.GRID_WIDTH; col++) {
                    this.grid[row][col] = Math.random() > 0.7 ? 1 : 0;
                }
            }
            this.drawGrid();
            this.showMessage("Grid randomized! Press Start to see it evolve.");
        }
    }

    /**
     * Adds the mousedown listener to the canvas element.
     * This listener will initiate the drag functionality.
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
     * Removes the mousedown listener from the canvas element.
     */
    private removeCanvasMouseDownListener(): void {
        const canvasElement = this.canvasRef?.nativeElement;
        if (canvasElement && this.boundHandleMouseDown) {
            canvasElement.removeEventListener('mousedown', this.boundHandleMouseDown);
            this.boundHandleMouseDown = null;
        }
    }

    /**
     * Adds global mousemove and mouseup listeners to the document.
     * These are active only during a drag operation.
     */
    private addGlobalMouseListeners(): void {
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
        document.addEventListener('mousemove', this.boundHandleMouseMove);
        document.addEventListener('mouseup', this.boundHandleMouseUp);
    }

    /**
     * Removes global mousemove and mouseup listeners from the document.
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
     * Handles the mousedown event on the canvas.
     * Initiates drawing and adds global mouse listeners.
     */
    private handleMouseDown(event: MouseEvent): void {
        if (this.running) return; // Prevent drawing if simulation is running

        this.isDragging = true;
        this.addGlobalMouseListeners(); // Start listening for global moves/ups

        // Process the initial click (turn on the cell under the mouse)
        this.processMouseCoordinates(event);
    }

    /**
     * Handles the mousemove event.
     * Activates cells while dragging.
     */
    private handleMouseMove(event: MouseEvent): void {
        if (!this.isDragging || this.running) return;
        this.processMouseCoordinates(event);
    }

    /**
     * Handles the mouseup event.
     * Stops drawing and removes global mouse listeners.
     */
    private handleMouseUp(event: MouseEvent): void {
        this.isDragging = false;
        this.removeGlobalMouseListeners(); // Stop listening for global moves/ups
        this.showMessage("Drawing complete. Press Start to see it evolve.");
    }

    /**
     * Unified function to process mouse coordinates and update grid.
     * Turns on the cell at the given coordinates.
     */
    private processMouseCoordinates(event: MouseEvent): void {
        const canvasElement = this.canvasRef!.nativeElement;
        const rect = canvasElement.getBoundingClientRect();

        // Calculate the actual drawable area width/height in CSS pixels
        // This is the inner content area, excluding the border.
        const drawableWidthCSS = rect.width - (this.BORDER_THICKNESS * 2);
        const drawableHeightCSS = rect.height - (this.BORDER_THICKNESS * 2);

        // Calculate the effective scale based on the canvas's internal drawing size
        // (canvasElement.width/height) versus its actual rendered drawable CSS size.
        const scaleX = canvasElement.width / drawableWidthCSS;
        const scaleY = canvasElement.height / drawableHeightCSS;

        // Get mouse coordinates relative to the top-left of the canvas's content area (inside the border).
        // event.clientX/Y are viewport coordinates.
        // rect.left/top are the border-box coordinates of the canvas in the viewport.
        // Subtracting rect.left/top gives coordinate relative to the outer border.
        // Subtracting BORDER_THICKNESS further shifts it to the inner content area.
        const mouseX = (event.clientX - rect.left - this.BORDER_THICKNESS) * scaleX;
        const mouseY = (event.clientY - rect.top - this.BORDER_THICKNESS) * scaleY;

        // Calculate grid column and row
        const col = Math.floor(mouseX / this.CELL_SIZE);
        const row = Math.floor(mouseY / this.CELL_SIZE);

        // Turn on cell if within grid boundaries and currently not running
        if (row >= 0 && row < this.GRID_HEIGHT && col >= 0 && col < this.GRID_WIDTH && !this.running) {
            // Only turn on, don't toggle, when drawing.
            if (this.grid[row][col] === 0) {
                this.grid[row][col] = 1;
                this.drawGrid();
            }
        }
    }

    onSpeedChange(event: Event): void {
        // The slider value directly represents generations per second.
        this.currentGenerationsPerSecond = parseInt((event.target as HTMLInputElement).value);
        // Calculate simulationInterval inversely to get linear change in speed.
        // e.g., 1 gen/sec -> 1000ms interval; 20 gen/sec -> 50ms interval.
        this.simulationInterval = 1000 / this.currentGenerationsPerSecond;

        this.showMessage(`Speed: ${this.currentGenerationsPerSecond} generations/second`, 'info');
        if (this.running) {
            cancelAnimationFrame(this.animationFrameId);
            this.lastUpdateTime = performance.now();
            this.animate(performance.now());
        }
    }

    /**
     * Opens the info popup modal.
     */
    openInfoPopup(): void {
        this.showInfoPopup = true;
    }

    /**
     * Closes the info popup modal.
     */
    closeInfoPopup(): void {
        this.showInfoPopup = false;
    }

    /**
     * Listens for window resize events to re-initialize the grid for responsiveness.
     */
    @HostListener('window:resize')
    onWindowResize(): void {
        // Since the game is always visible, we always respond to resize
        if (this.canvasRef?.nativeElement) {
            const canvasElement = this.canvasRef.nativeElement;
            const currentContainerWidth = canvasElement.parentElement!.clientWidth;

            // Only re-initialize if the available drawing width actually changed significantly
            const availableContainerPadding = 24 * 2; // p-6 on the parent div
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
