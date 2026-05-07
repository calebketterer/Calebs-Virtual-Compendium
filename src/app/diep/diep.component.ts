import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiepMenus } from './ui/diep.menus-manager';
import { DiepWorldRenderer } from './ui/diep.arena-renderer';
import { DiepHudRenderer } from './ui/hud/diep.hud-renderer';
import { DiepGameEngineService } from './engine/diep.game-engine.service'; 
import { DiepInputService } from './engine/diep.input.service';
import { DiepInteractionService } from './ui/diep.interaction.service';
import { DiepDebugService} from './engine/debug/diep.debug.service';

@Component({
  selector: 'app-diep',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diep.component.html',
  styleUrls: ['./diep.component.css'], 
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiepComponent implements AfterViewInit { 
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  constructor(
    public gameEngine: DiepGameEngineService, 
    private inputService: DiepInputService,
    private interactionService: DiepInteractionService,
    private debugService: DiepDebugService
  ) {}

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.canvasRef.nativeElement.focus(); 
    
    // Ensure the manager knows it should be fading in
    this.gameEngine.transition.fadeIn();

    // Start the engine ticker and tell it how to draw
    this.gameEngine.startTicker(() => this.draw());
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

    if (this.debugService.handleDebugInput(event)) {
      return;
    }

    this.inputService.handleKeyDown(
      event, 
      () => this.draw(), 
      () => this.gameEngine.startTicker(() => this.draw())
    );
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.inputService.handleKeyUp(event);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.inputService.handleMouseMove(event, this.canvasRef.nativeElement);
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    // 1. First, check if the user clicked a UI button or the pause icon
    const handledByUi = this.interactionService.handleMouseEvent(
      event, 
      this.canvasRef.nativeElement,
      () => this.gameEngine.startTicker(() => this.draw()), 
      () => this.draw()
    );

    // 2. If it wasn't a UI click, proceed to game input (e.g., shooting)
    if (!handledByUi) {
      this.inputService.handleMouseDown(
        event, 
        this.canvasRef.nativeElement,
        () => this.gameEngine.startTicker(() => this.draw()), 
        () => this.draw()
      );
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.inputService.handleMouseUp(event);
  }

  draw() {
    const g = this.gameEngine;
    const ctx = this.ctx;
    const w = g.width;
    const h = g.height;

    // 1. Draw Game World (Ground, Enemies, Players, Walls)
    DiepWorldRenderer.renderWorld(ctx, g, w, h);

    // 2. Draw HUD (Now manages its own internal start-check)
    DiepHudRenderer.draw(ctx, g, w, h);

    // 3. Draw UI Layers (Menus, Overlays, Transitions)
    DiepMenus.renderUI(ctx, g, w, h);
  }
}