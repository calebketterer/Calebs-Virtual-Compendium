import { Component, ElementRef, ViewChild, AfterViewInit, Renderer2, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Game Components
import { SudokuComponent } from './sudoku/sudoku.component';
import { ConwayComponent } from './conway/conway.component';
import { SnakeComponent } from './snake/snake.component';
import { TetrisComponent } from './tetris/tetris.component';
import { DiepComponent } from './diep/diep.component';
import { ClickerOverlayComponent } from './clicker-overlay/clicker-overlay.component';
import { GwentComponent } from './gwent/gwent.component';

// Local Logic & Assets
import { DEFAULT_COLORS, MESSAGE_BOX_DEFAULTS } from './home/home.constants';
import { UiEffectsService } from './home/home.ui-effects.service';
import { HomeStateService } from './home/home.state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, CommonModule, FormsModule, SudokuComponent, 
    ConwayComponent, SnakeComponent, TetrisComponent, 
    DiepComponent, ClickerOverlayComponent, GwentComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  messageBoxText = MESSAGE_BOX_DEFAULTS.TEXT;
  messageBoxClass = MESSAGE_BOX_DEFAULTS.CLASS;

  @ViewChild('colorfulHeader', { static: true }) colorfulHeader!: ElementRef<HTMLHeadingElement>;
  @ViewChild('heyThere', { static: true }) heyThere!: ElementRef<HTMLElement>;
  @ViewChild('goodNews', { static: true }) goodNews!: ElementRef<HTMLElement>;
  @ViewChild('Tips', { static: true }) Tips!: ElementRef<HTMLElement>;

  private currentColors = [...DEFAULT_COLORS];
  private lastX = 50;

  constructor(
    private renderer: Renderer2,
    private uiService: UiEffectsService,
    public state: HomeStateService 
  ) {}

  ngAfterViewInit(): void {
    this.updateHeaderGradient(50);
    if (this.colorfulHeader?.nativeElement) {
      this.colorfulHeader.nativeElement.onclick = () => this.onHeaderClick();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.colorfulHeader?.nativeElement) return;
    this.lastX = (event.clientX / window.innerWidth) * 100;
    this.updateHeaderGradient(this.lastX);
  }

  @HostListener('window:mouseout', ['$event'])
  onMouseOut(event: MouseEvent) {
    if (!event.relatedTarget) this.updateHeaderGradient(50);
  }

  private updateHeaderGradient(x: number) {
    const gradient = this.uiService.generateGradientString(x, this.currentColors);
    this.renderer.setStyle(this.colorfulHeader.nativeElement, 'backgroundImage', gradient);
  }

  private onHeaderClick() {
    this.state.handleGlobalClick();
    this.currentColors = this.uiService.getRandomizedColors(DEFAULT_COLORS.length);
    this.updateHeaderGradient(this.lastX);
    this.state.toggleContent(this.state.selectedView);
  }

  onViewChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.state.updateView(val);
  }

  /**
   * Restored to satisfy the HTML template (click) binding.
   * Logic is offloaded to the state service.
   */
  toggleOriginalContent(event?: Event): void {
    this.state.toggleContent(this.state.selectedView);
  }

  // --- Shake Logic ---

  shakeHeyThere() {
    this.state.handleGlobalClick();
    this.applyShake(this.heyThere.nativeElement);
  }

  shakeGoodNews() {
    this.state.handleGlobalClick();
    this.applyShake(this.goodNews.nativeElement);
  }

  shakeTips() {
    this.state.handleGlobalClick();
    this.state.cycleTip();
    this.applyShake(this.Tips.nativeElement);
  }

  private applyShake(element: HTMLElement) {
    this.renderer.removeClass(element, 'shake');
    void element.offsetWidth; // trigger reflow
    this.renderer.addClass(element, 'shake');
  }

  toggleDirection() {
    this.state.handleGlobalClick();
    this.state.reverse = !this.state.reverse;
  }
}