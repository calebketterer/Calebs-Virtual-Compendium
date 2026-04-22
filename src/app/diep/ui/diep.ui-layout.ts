import { DiepButton } from '../core/diep.interfaces';

/**
 * UI SHARED CONFIG / JUNK DRAWER
 * Use this for:
 * 1. Prototyping new buttons quickly.
 * 2. Defining UI elements that appear across MULTIPLE menus (Global HUD).
 * 3. Shared button templates to keep coordinates consistent.
 */
export class DiepUIConfig {
  
  /**
   * SHARED TEMPLATES
   * Use these to generate standardized buttons without re-typing colors/sizes.
   */
  public static getStandardBackBtn(width: number, height: number, action: () => void): DiepButton {
    return {
      id: 'back-btn',
      label: 'BACK',
      x: width / 2 - 100,
      y: height - 100,
      w: 200,
      h: 50,
      color: '#e74c3c',
      borderColor: '#c0392b',
      action: action
    };
  }

  /**
   * GLOBAL HUD ELEMENTS
   * Buttons that might appear regardless of state (e.g., a Settings gear).
   */
  public static getGlobalHUD(g: any, width: number): DiepButton[] {
    return [
      /* Example: { id: 'settings-btn', label: '⚙', x: width - 50, y: 10, ... } */
    ];
  }

  /**
   * PROTOTYPE / DEBUG DRAWER
   * Throw temporary buttons here during development to test new engine features.
   */
  public static getDebugButtons(g: any): DiepButton[] {
    return [
      {
        id: 'debug-nuke',
        label: 'NUKE ALL',
        x: 10,
        y: 10,
        w: 100,
        h: 30,
        color: '#ff4757',
        borderColor: '#ff6b81',
        fontSize: 'bold 12px Inter, sans-serif',
        action: () => {
          console.log("Nuking all enemies for testing...");
          // g.enemies = []; 
        }
      }
    ];
  }
}