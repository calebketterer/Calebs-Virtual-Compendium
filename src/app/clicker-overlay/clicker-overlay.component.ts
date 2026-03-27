import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Target {
  id: number;
  top: number; // Switched to number for easier math
  left: number;
  shape: string;
  coreColor: string;
  outlineColor: string;
  isDragging?: boolean;
  startX?: number;
  startY?: number;
}

@Component({
  selector: 'app-clicker-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clicker-overlay.component.html',
  styleUrl: './clicker-overlay.component.css'
})
export class ClickerOverlayComponent implements OnChanges {
  @Input() displayCount: number = 0;
  @Output() targetClicked = new EventEmitter<void>();

  targets: Target[] = [];
  activeTarget: Target | null = null;
  private offset = { x: 0, y: 0 };
  
  private shapes: string[] = ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'octagon'];
  private colorPool: string[] = ["#f0060b", "#ff41f8", "#7702ff", "#cc26d5", "#00d4ff", "#ffde00", "#00ff6a"];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['displayCount']) this.updateGameLogic();
  }

  // --- DRAG LOGIC ---
  startDrag(event: MouseEvent, target: Target) {
  event.preventDefault();
  event.stopPropagation(); // Prevents bubbling
  
  this.activeTarget = target;
  target.isDragging = true;
  
  // Store starting position to differentiate click vs drag
  target.startX = event.clientX;
  target.startY = event.clientY;
  
  this.offset.x = event.clientX - target.left;
  this.offset.y = event.clientY - target.top;
}

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.activeTarget) return;
    
    // Update position based on mouse movement
    this.activeTarget.left = event.clientX - this.offset.x;
    this.activeTarget.top = event.clientY - this.offset.y;
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.activeTarget) {
      this.activeTarget.isDragging = false;
      this.activeTarget = null;
    }
  }

  // --- CLICK LOGIC ---
  handleTargetClick(event: MouseEvent, target: Target) {
  // Calculate distance moved
  const deltaX = Math.abs(event.clientX - (target.startX || 0));
  const deltaY = Math.abs(event.clientY - (target.startY || 0));

  // Threshold: If moved less than 5px, it's a click. Otherwise, it's a drag.
  if (deltaX < 5 && deltaY < 5) {
    this.targetClicked.emit();
    this.teleportTarget(target);
  }
}

  private teleportTarget(target: Target) {
    target.top = Math.random() * (window.innerHeight - 100);
    target.left = Math.random() * (window.innerWidth - 100);
  }

  // --- SPAWN/COLOR LOGIC ---
  private updateGameLogic() {
    if (this.targets.length === 0 && this.displayCount >= 5) this.addNewTarget();

    if (this.displayCount % 5 === 0 && this.displayCount > 0) {
      this.targets.forEach(t => {
        const colors = this.getUniqueColors();
        t.coreColor = colors.core;
        t.outlineColor = colors.outline;
      });
    }

    if (this.displayCount % 20 === 0 && this.displayCount > 0) this.addNewTarget();
  }

  private addNewTarget() {
    const colors = this.getUniqueColors();
    this.targets.push({
      id: Date.now(),
      top: Math.random() * (window.innerHeight - 100),
      left: Math.random() * (window.innerWidth - 100),
      shape: this.shapes[Math.floor(Math.random() * this.shapes.length)],
      coreColor: colors.core,
      outlineColor: colors.outline
    });
  }

  private getUniqueColors() {
    const core = this.colorPool[Math.floor(Math.random() * this.colorPool.length)];
    let outline: string;
    do { outline = this.colorPool[Math.floor(Math.random() * this.colorPool.length)]; } 
    while (outline === core);
    return { core, outline };
  }
}