import { Component, ElementRef, ViewChild, AfterViewInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SudokuComponent } from './sudoku/sudoku.component';
import { ConwayComponent } from './conway/conway.component';
import { SnakeComponent } from './snake/snake.component';
import { TetrisComponent } from './tetris/tetris.component';
import { DiepComponent } from './diep/diep.component';
import { ClickerOverlayComponent } from './clicker-overlay/clicker-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, SudokuComponent, ConwayComponent, SnakeComponent, TetrisComponent, DiepComponent, ClickerOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  title = 'ExampleWebsite';
  selectedView: string = 'main-site';
  isOriginalContentHidden: boolean = false; // State to track if the content is hidden

  messageBoxText: string = "Click on cells to toggle them, then press Start!";
  messageBoxClass: string = "p-3 bg-blue-100 text-blue-800 rounded-md text-sm w-full text-center";

  @ViewChild('colorfulHeader', { static: true })
  colorfulHeader!: ElementRef<HTMLHeadingElement>;
  @ViewChild('heyThere', { static: true })
  heyThere!: ElementRef<HTMLElement>;
  @ViewChild('goodNews', { static: true })
  goodNews!: ElementRef<HTMLElement>;
  @ViewChild('Tips', { static: true })
  Tips!: ElementRef<HTMLElement>;

  // Default gradient colors (from your last list)
  private defaultColors: string[] = [
    "#f0060b",    // vivid red
    "#ff41f8",    // vivid pink
    "#7702ff",    // electric violet
    "#cc26d5",    // french violet
    "#ff41f8",    // vivid pink (again for symmetry)
    "#f0060b"     // vivid red (again for symmetry)
  ];

  // Color pool using all provided color options (CSS oklch and hex)
  private colorPool: string[] = [
    "oklch(51.01% 0.274 263.83)", // --bright-blue
    "oklch(53.18% 0.28 296.97)",  // --electric-violet
    "oklch(47.66% 0.246 305.88)", // --french-violet
    "oklch(69.02% 0.277 332.77)", // --vivid-pink
    "oklch(55.34% 0.1608 140.47)",// --hot-red
    "oklch(37.54% 0.2278 269.73)",// --orange-red
    "oklch(45% 0.25 30)",         // --red
    "oklch(75% 0.2 110)",         // --yellow
    "oklch(50% 0.25 264)",        // --blue
    "oklch(47.66% 0.246 305.88)", // --violet
    "#f0060b",
    "#ff41f8",
    "#7702ff",
    "#cc26d5"
  ];

  private currentColors: string[] = [];
  private lastX = 50;

  private tipsList: string[] = [
    "Every object on this page is clickable! Give it a try.",
    "Try clicking the header to randomize the site colors!",
    "The Diep component is my personal favorite.",
    "The gradient follows your mouse—try moving it side to side.",
    "You can toggle the visibility of the header content in sub-views.",
    "Double-click the 'Tips' line to see more secrets!",
    "Access songs I wrote and produced on my Google Site.",
    "Read my compendium of short stories on the Google Docs."
  ];
  currentTipText: string = this.tipsList[0];

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.currentColors = [...this.defaultColors];
    this.setHorizontalGradient(50);

    document.addEventListener('mousemove', this.onDocumentMouseMove);
    window.addEventListener('mouseout', this.onWindowMouseOut);

    // MODIFIED HEADER CLICK LISTENER
    this.colorfulHeader.nativeElement.addEventListener('click', () => {
      this.handleGlobalClick();
      // Color randomization logic
      this.currentColors = this.getRandomizedColors(this.defaultColors.length);
      this.setHorizontalGradient(this.lastX);
      
      // Content toggling logic added
      this.toggleOriginalContent(); 
    });
  }

  setHorizontalGradient(x: number) {
    // Shift the gradient stops with cursor movement
    const stops = this.currentColors.map(
      (color, idx) => {
        const shift = x - 50; // x=50 is center, range: -50 to +50
        const spread = 100 / (this.currentColors.length - 1);
        let pos = idx * spread + shift * 0.4; // 0.4 = how much the gradient moves
        pos = Math.max(0, Math.min(100, pos));
        return `${color} ${pos.toFixed(1)}%`;
      }
    ).join(', ');

    const horizontalGradient = `linear-gradient(to right, ${stops})`;

    this.colorfulHeader.nativeElement.style.backgroundImage = horizontalGradient;
    this.colorfulHeader.nativeElement.style.backgroundBlendMode = ''; // no blend needed
    this.colorfulHeader.nativeElement.style.transition =
      'background-image 0.5s cubic-bezier(.77,0,.18,1), background-position 0.25s cubic-bezier(.77,0,.18,1)';
  }

  private onDocumentMouseMove = (event: MouseEvent) => {
    if (!this.colorfulHeader?.nativeElement) return;
    const x = (event.clientX / window.innerWidth) * 100;
    this.lastX = x;
    this.setHorizontalGradient(x);
  };

  private onWindowMouseOut = (event: MouseEvent) => {
    if (!event.relatedTarget && this.colorfulHeader?.nativeElement) {
      this.lastX = 50;
      this.setHorizontalGradient(50);
    }
  };

  /**
   * Pick a random selection of unique colors from color pool.
   */
  getRandomizedColors(count: number): string[] {
    const shuffled = this.colorPool.slice().sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count);
    while (picked.length < count) {
      picked.push(shuffled[picked.length % shuffled.length]);
    }
    return picked;
  }
 
  /**
   * Toggles the visibility of the original content block if a sub-component view is active.
   */
  toggleOriginalContent(event?: Event): void {
    if (this.selectedView !== 'main-site') {
      event?.preventDefault(); 
      event?.stopPropagation();
      this.isOriginalContentHidden = !this.isOriginalContentHidden;
    }
  }

  onViewChange(event: Event): void {
    this.selectedView = (event.target as HTMLSelectElement).value;
    
    if (this.selectedView === 'main-site') {
        this.isOriginalContentHidden = false; 
    } else {
        this.globalClickCount = 0;
        this.showClickerGame = false;
    }
}

  shakeHeyThere() {
    this.handleGlobalClick();
    const el = this.heyThere.nativeElement;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  shakeGoodNews() {
    this.handleGlobalClick();
    const el = this.goodNews.nativeElement;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  shakeTips() {
    this.handleGlobalClick();

    //Update text
    let newIndex: number;
    do {
      newIndex = Math.floor(Math.random() * this.tipsList.length);
    } while (this.tipsList[newIndex] === this.currentTipText);
    
    this.currentTipText = this.tipsList[newIndex];

    //Shake animation
    const el = this.Tips.nativeElement;
    el.classList.remove('shake');
    void el.offsetWidth; // Trigger reflow to restart animation
    el.classList.add('shake');
  }

  reverse = false;
  toggleDirection() {
    this.handleGlobalClick();
    this.reverse = !this.reverse;
  }

  globalClickCount: number = 0; // The master counter
  showClickerGame: boolean = false; // Controls the visibility

  // Helper to check if we should unlock the game
  handleGlobalClick() {
    this.globalClickCount++;
    if (this.globalClickCount >= 5) {
      this.showClickerGame = true;
    }
  }
}

