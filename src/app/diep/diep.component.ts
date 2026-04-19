import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiepMenus } from './ui/diep.menus-manager';
import { DiepGameEngineService } from './engine/diep.game-engine.service'; 
import { DiepInputService } from './engine/diep.input.service';

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
    private inputService: DiepInputService
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
    this.inputService.handleKeyDown(event, () => this.draw(), () => this.gameEngine.startTicker(() => this.draw()));
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
    this.inputService.handleMouseDown(
      event, 
      this.canvasRef.nativeElement,
      () => this.gameEngine.startTicker(() => this.draw()), 
      () => this.draw()
    );
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.inputService.handleMouseUp(event);
  }

  draw() {
    DiepMenus.renderGame(this.ctx, this.gameEngine, this.gameEngine.width, this.gameEngine.height);
  }
}