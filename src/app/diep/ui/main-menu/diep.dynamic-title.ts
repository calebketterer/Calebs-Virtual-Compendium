export interface TitleState {
  sineWave: boolean;      
  perLetterWave: boolean; 
  squashStretch: boolean; 
  tilt: boolean;          
  ghostEcho: boolean;     
  jitter: boolean;        
  globalLerp: boolean;    
  perLetterLerp: boolean; 
  gridBackdrop: boolean;  
  barrelRecoil: boolean;  
  orbitingShapes: boolean;
  gravityDrop: boolean;   
  glowPulse: boolean;          
  scanlines: boolean;          
  chromaticAberration: boolean; 
  letterOutline: boolean;      
}

interface Bullet { x: number; y: number; velY: number; alpha: number; color: string; }
interface FallingLetter { index: number; char: string; x: number; y: number; velY: number; alpha: number; active: boolean; color: string; }
interface DiepShape { x: number; y: number; vx: number; vy: number; rotation: number; vr: number; type: number; color: string; borderColor: string; }

export class DiepDynamicTitle {
  private static readonly GLOBAL_SPEED = 0.6;   
  private static readonly SWITCH_INTERVAL = 5 * 60; 
  private static readonly TRANSITION_SPEED = 0.02 * DiepDynamicTitle.GLOBAL_SPEED;
  private static readonly MIN_FEATURES = 5;
  private static readonly MAX_FEATURES = 7;

  private static readonly DIEP_BLUE = '#3498db';
  private static readonly SHAPE_DATA = [
    { type: 3, color: '#f1c40f', border: '#c7a30c' }, 
    { type: 4, color: '#e74c3c', border: '#c0392b' }, 
    { type: 5, color: '#764ba2', border: '#5e3c81' }  
  ];
  private static colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

  private static state: TitleState;
  private static prevState: TitleState;
  private static transitionLerp = 1.0; 
  private static lastSwitchFrame = 0;
  private static internalFrame = 0;

  private static isPaused = false;
  private static isResetting = false;

  private static bullets: Bullet[] = [];
  private static fallingLetters: FallingLetter[] = [];
  private static shapes: DiepShape[] = [];

  public static handleClick(doubleClick: boolean = false): void {
    if (doubleClick) {
      this.isResetting = true;
      this.isPaused = false; 
      this.prevState = { ...this.state };
      this.state = this.getStaticState();
      this.transitionLerp = 0;
    } else {
      // Only allow toggle pause if we aren't currently in the middle of a reset
      if (!this.isResetting) {
        this.isPaused = !this.isPaused;
      }
    }
  }

  public static draw(ctx: CanvasRenderingContext2D, x: number, y: number, externalFrame: number): void {
    if (!this.isPaused) {
      this.internalFrame += this.GLOBAL_SPEED;
    }
    
    const frame = this.internalFrame;
    const text = "DIEP SINGLEPLAYER";
    const charWidth = 45;
    const startX = x - ((text.length - 1) * charWidth) / 2;

    if (!this.state) { 
      this.state = this.getStaticState(); 
      this.prevState = this.getStaticState();
      this.initShapes(x, y); 
    }

    if (!this.isPaused && !this.isResetting && frame - this.lastSwitchFrame >= this.SWITCH_INTERVAL) {
      this.prevState = { ...this.state };
      this.state = this.getRandomState();
      this.lastSwitchFrame = frame;
      this.transitionLerp = 0; 
    }

    // Transitions must run even if "paused" during a reset phase
    if (this.transitionLerp < 1) {
      this.transitionLerp += this.TRANSITION_SPEED;
    } else if (this.isResetting) {
      this.isResetting = false;
      this.isPaused = true; 
    }

    ctx.save();
    
    const gridInt = this.blend('gridBackdrop');
    if (gridInt > 0) this.drawGrid(ctx, x, y, frame, gridInt);

    let globalY = y;
    globalY += (Math.sin(frame * 0.02) * 12 * this.blend('sineWave'));

    ctx.translate(x, globalY);
    const activeTilt = this.blend('tilt');
    if (activeTilt > 0) {
      ctx.rotate(Math.cos(frame * 0.015) * (0.04 * activeTilt));
    }
    ctx.translate(-x, -globalY);

    if (this.blend('orbitingShapes') > 0) {
      this.updateAndDrawShapes(ctx, x, globalY, this.blend('orbitingShapes'));
    }

    this.updateBullets(ctx);
    this.renderCharacters(ctx, text, startX, globalY, charWidth, frame);

    const scanlineInt = this.blend('scanlines');
    if (scanlineInt > 0.05) this.drawScanlines(ctx, x, globalY, scanlineInt);
    
    ctx.restore();
  }

  private static blend(feature: keyof TitleState): number {
    if (!this.state || !this.prevState) return 0;
    const prev = this.prevState[feature] ? 1 : 0;
    const curr = this.state[feature] ? 1 : 0;
    const t = this.transitionLerp;
    const smoothT = t * t * (3 - 2 * t);
    return prev + (curr - prev) * smoothT;
  }

  private static initShapes(centerX: number, centerY: number) {
    for (let i = 0; i < 9; i++) {
      const data = this.SHAPE_DATA[i % this.SHAPE_DATA.length];
      this.shapes.push({
        x: centerX + (Math.random() - 0.5) * 600,
        y: centerY + (Math.random() - 0.5) * 400,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.05,
        type: data.type,
        color: data.color,
        borderColor: data.border
      });
    }
  }

  private static updateAndDrawShapes(ctx: CanvasRenderingContext2D, cx: number, cy: number, intensity: number) {
    const bounds = { w: 500, h: 300 };
    this.shapes.forEach(s => {
      if (!this.isPaused) {
        s.x += s.vx * this.GLOBAL_SPEED;
        s.y += s.vy * this.GLOBAL_SPEED;
        s.rotation += s.vr * this.GLOBAL_SPEED;
        if (Math.abs(s.x - cx) > bounds.w) s.vx *= -1;
        if (Math.abs(s.y - cy) > bounds.h) s.vy *= -1;
      }

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.globalAlpha = intensity;
      ctx.fillStyle = s.color;
      ctx.strokeStyle = s.borderColor;
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'miter';
      ctx.beginPath();
      for (let i = 0; i < s.type; i++) {
        const sx = Math.cos(i * (Math.PI * 2 / s.type)) * 18;
        const sy = Math.sin(i * (Math.PI * 2 / s.type)) * 18;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  private static renderCharacters(ctx: CanvasRenderingContext2D, text: string, startX: number, y: number, spacing: number, frame: number): void {
    ctx.font = '900 70px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;

    const outlineInt = this.blend('letterOutline');

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const isSpace = char === ' ';
      
      const faller = this.fallingLetters.find(f => f.index === i && f.active);
      if (faller) {
        this.drawFallingLetter(ctx, faller);
        continue; 
      }

      let charColor = this.DIEP_BLUE;
      const gLerp = this.blend('globalLerp');
      const pLerp = this.blend('perLetterLerp');
      if (gLerp > 0.5) charColor = this.getGlobalColor(frame);
      else if (pLerp > 0.5) charColor = this.colors[(Math.floor(frame * 0.03) + i) % this.colors.length];

      if (!isSpace && !this.isPaused && this.blend('gravityDrop') > 0.6 && Math.random() < 0.0015 * this.GLOBAL_SPEED) {
        this.fallingLetters.push({ index: i, char, x: startX + (i * spacing), y, velY: 1.5, alpha: 1, active: true, color: charColor });
        continue;
      }

      ctx.save();
      let charY = y;
      let charX = startX + (i * spacing);
      
      charY += (Math.sin((frame * 0.04) + (i * 0.4)) * 15) * this.blend('perLetterWave');

      const recoilInt = this.blend('barrelRecoil');
      if (!isSpace && recoilInt > 0) {
        const fireOffset = Math.floor(frame + (i * 30)) % 220;
        if (fireOffset < 12) {
          const recoilKick = (12 - fireOffset) * 2.5 * recoilInt;
          charY += recoilKick;
          if (!this.isPaused && fireOffset === 0) {
            this.bullets.push({ x: charX, y: charY - 45 - recoilKick, velY: -9, alpha: 1, color: charColor });
          }
        }
      }

      const breath = (Math.cos((frame * 0.05) + i) * 0.12) * this.blend('squashStretch');
      const jitter = this.blend('jitter');
      if (jitter > 0) {
        charX += Math.sin(frame * 0.2 + i) * 3 * jitter;
        charY += Math.cos(frame * 0.2 + i) * 3 * jitter;
      }

      const glow = this.blend('glowPulse');
      if (glow > 0) {
        ctx.shadowBlur = (15 + Math.sin(frame * 0.1) * 10) * glow;
        ctx.shadowColor = charColor;
      }

      const chrom = this.blend('chromaticAberration');
      if (chrom > 0) {
        ctx.save();
        ctx.translate(charX, charY);
        ctx.scale(1 + breath, 1 - breath);
        ctx.globalAlpha = 0.4 * chrom;
        ctx.fillStyle = '#ff0000'; ctx.fillText(char, -4 * chrom, 0);
        ctx.fillStyle = '#00ffff'; ctx.fillText(char, 4 * chrom, 0);
        ctx.restore();
      }

      ctx.translate(charX, charY);
      ctx.scale(1 + breath, 1 - breath);
      
      if (outlineInt > 0) {
        ctx.strokeStyle = this.getDarkerHue(charColor);
        ctx.lineWidth = 10 * outlineInt;
        ctx.strokeText(char, 0, 0);
      }

      ctx.fillStyle = charColor;
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }

  private static updateBullets(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (!this.isPaused) {
        b.y += b.velY * this.GLOBAL_SPEED;
        b.alpha -= 0.012 * this.GLOBAL_SPEED;
      }
      if (b.y < -200 || b.alpha <= 0) { this.bullets.splice(i, 1); continue; }
      
      ctx.globalAlpha = Math.max(0, b.alpha);
      ctx.fillStyle = b.color;
      ctx.strokeStyle = this.getDarkerHue(b.color);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  private static drawFallingLetter(ctx: CanvasRenderingContext2D, f: FallingLetter) {
    if (!this.isPaused) {
      f.y += f.velY * this.GLOBAL_SPEED;
      f.velY += 0.15 * this.GLOBAL_SPEED; 
      f.alpha -= 0.008 * this.GLOBAL_SPEED;
    }
    if (f.alpha <= 0) { f.active = false; return; }
    
    const outlineInt = this.blend('letterOutline');
    ctx.save();
    ctx.globalAlpha = Math.max(0, f.alpha);
    ctx.font = '900 70px Inter, sans-serif';
    
    if (outlineInt > 0) {
      ctx.strokeStyle = this.getDarkerHue(f.color);
      ctx.lineWidth = 10 * outlineInt;
      ctx.strokeText(f.char, f.x, f.y);
    }
    
    ctx.fillStyle = f.color;
    ctx.fillText(f.char, f.x, f.y);
    ctx.restore();
  }

  private static drawScanlines(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number) {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * intensity})`;
    ctx.lineWidth = 1;
    const offset = (this.internalFrame * 2) % 20;
    ctx.beginPath();
    for (let i = -150; i < 150; i += 10) {
      ctx.moveTo(x - 450, y + i + offset);
      ctx.lineTo(x + 450, y + i + offset);
    }
    ctx.stroke(); ctx.restore();
  }

  private static drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, intensity: number): void {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * intensity})`;
    ctx.lineWidth = 1;
    const step = 50;
    const offX = (frame * 0.3) % step; const offY = (frame * 0.1) % step;
    ctx.beginPath();
    for (let i = -600; i <= 600; i += step) {
      ctx.moveTo(x + i + offX, y - 400); ctx.lineTo(x + i + offX, y + 400);
      ctx.moveTo(x - 600, y + i + offY); ctx.lineTo(x + 600, y + i + offY);
    }
    ctx.stroke(); ctx.restore();
  }

  private static getStaticState(): TitleState {
    return {
      sineWave: false, perLetterWave: false, squashStretch: false, tilt: false,
      ghostEcho: false, jitter: false, globalLerp: false, perLetterLerp: false,
      gridBackdrop: false, barrelRecoil: false, orbitingShapes: false, gravityDrop: false,
      glowPulse: false, scanlines: false, chromaticAberration: false, letterOutline: false
    };
  }

  private static getRandomState(): TitleState {
    const keys = Object.keys(this.getStaticState()) as (keyof TitleState)[];
    const newState = this.getStaticState() as any;
    const count = Math.floor(Math.random() * (this.MAX_FEATURES - this.MIN_FEATURES + 1)) + this.MIN_FEATURES;
    const shuffled = [...keys].sort(() => 0.5 - Math.random());
    for (let i = 0; i < count; i++) newState[shuffled[i]] = true;
    if (newState.globalLerp && newState.perLetterLerp) newState.perLetterLerp = false;
    return newState as TitleState;
  }

  private static getGlobalColor(frame: number): string {
    const speed = 0.008 * this.GLOBAL_SPEED;
    const idx = Math.floor((frame * speed) % this.colors.length);
    const nextIdx = (idx + 1) % this.colors.length;
    return this.lerpColor(this.colors[idx], this.colors[nextIdx], (frame * speed) % 1);
  }

  private static getDarkerHue(hex: string): string {
    const ah = parseInt(hex.replace(/#/g, ''), 16);
    const r = Math.max(0, Math.round((ah >> 16) * 0.75));
    const g = Math.max(0, Math.round(((ah >> 8) & 0xff) * 0.75));
    const b = Math.max(0, Math.round((ah & 0xff) * 0.75));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private static lerpColor(a: string, b: string, amount: number): string {
    const ah = parseInt(a.replace(/#/g, ''), 16), bh = parseInt(b.replace(/#/g, ''), 16);
    const rr = Math.round((ah >> 16) + amount * ((bh >> 16) - (ah >> 16))),
          rg = Math.round(((ah >> 8) & 0xff) + amount * (((bh >> 8) & 0xff) - ((ah >> 8) & 0xff))),
          rb = Math.round((ah & 0xff) + amount * ((bh & 0xff) - (ah & 0xff)));
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
  }
}