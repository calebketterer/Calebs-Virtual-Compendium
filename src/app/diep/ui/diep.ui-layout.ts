import { DiepButton } from '../diep.interfaces';

export class DiepUIConfig {
  public static getStartMenuButtons(g: any, width: number, height: number): DiepButton[] {
    return [{
      id: 'start',
      label: 'START',
      x: width / 2 - 100,
      y: height / 2 + 20,
      w: 200,
      h: 55,
      color: '#2ecc71',
      borderColor: '#27ae60',
      fontSize: 'bold 30px Inter, sans-serif',
      action: () => g.startGame()
    }];
  }

  public static getPauseMenuButtons(g: any, width: number, height: number): DiepButton[] {
    const playBtnW = 160;
    const toggleBtnW = 320; 
    return [
      {
        id: 'resume',
        label: 'RESUME',
        x: width / 2 - (playBtnW / 2),
        y: height / 2 - 40,
        w: playBtnW,
        h: 45,
        color: '#2ecc71',
        borderColor: '#27ae60',
        action: () => g.togglePause()
      },
      {
        id: 'darkmode',
        label: g.isDarkMode ? 'CLICK FOR LIGHT MODE 🌞' : 'CLICK FOR DARK MODE 🌙',
        x: width / 2 - (toggleBtnW / 2),
        y: height / 2 + 40,
        w: toggleBtnW,
        h: 45,
        color: g.isDarkMode ? '#34495e' : '#ecf0f1',
        borderColor: g.isDarkMode ? '#2c3e50' : '#bdc3c7',
        textColor: g.isDarkMode ? '#ecf0f1' : '#333',
        action: () => g.toggleDarkMode()
      }
    ];
  }

  public static getGameOverButtons(g: any, width: number, height: number): DiepButton[] {
    const btnW = 160;
    const btnX = width / 2 - 80;
    return [
      {
        id: 'replay',
        label: 'REPLAY',
        x: btnX,
        y: height / 2 + 60,
        w: btnW,
        h: 45,
        color: '#e74c3c',
        borderColor: '#c0392b',
        action: () => g.restartGame()
      },
      {
        id: 'main-menu',
        label: 'MAIN MENU',
        x: btnX,
        y: height / 2 + 120,
        w: btnW,
        h: 45,
        color: '#2c3e50',
        borderColor: '#34495e',
        action: () => g.returnToMainMenu()
      }
    ];
  }
}