import { DiepButton } from '../diep.interfaces';

export class DiepUIConfig {
  public static getStartMenuButtons(g: any, width: number, height: number): DiepButton[] {
    return [
      {
        id: 'start-btn',
        label: 'START GAME',
        x: width / 2 - 100,
        y: height / 2,
        w: 200,
        h: 50,
        color: '#2ecc71',
        borderColor: '#27ae60',
        action: () => g.startGameWithFade()
      }
    ];
  }

  public static getPauseMenuButtons(g: any, width: number, height: number): DiepButton[] {
    return [
      {
        id: 'resume-btn',
        label: 'RESUME',
        x: width / 2 - 100,
        y: height / 2 - 30,
        w: 200,
        h: 50,
        color: '#2ecc71',
        borderColor: '#27ae60',
        action: () => g.togglePause()
      },
      {
        id: 'main-menu-pause-btn',
        label: 'MAIN MENU',
        x: width / 2 - 100,
        y: height / 2 + 40,
        w: 200,
        h: 50,
        color: '#e74c3c',
        borderColor: '#c0392b',
        action: () => g.returnToMainMenuWithFade()
      },
      {
        id: 'dark-mode-btn',
        label: g.isDarkMode ? 'LIGHT MODE' : 'DARK MODE',
        x: width / 2 - 100,
        y: height / 2 + 110,
        w: 200,
        h: 40,
        color: '#95a5a6',
        borderColor: '#7f8c8d',
        action: () => g.toggleDarkMode()
      }
    ];
  }

  public static getGameOverButtons(g: any, width: number, height: number): DiepButton[] {
    return [
      {
        id: 'play-again-btn',
        label: 'PLAY AGAIN',
        x: width / 2 - 110,
        y: height / 2 + 60,
        w: 220,
        h: 60,
        color: '#2ecc71',
        borderColor: '#27ae60',
        fontSize: 'bold 30px Inter, sans-serif',
        action: () => g.restartGameWithFade()
      },
      {
        id: 'main-menu-gameover-btn',
        label: 'MAIN MENU',
        x: width / 2 - 100,
        y: height / 2 + 140,
        w: 200,
        h: 50,
        color: '#34495e',
        borderColor: '#2c3e50',
        action: () => g.returnToMainMenuWithFade()
      }
    ];
  }
}