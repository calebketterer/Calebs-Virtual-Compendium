# Caleb's Virtual Compendium

![Capture](https://github.com/user-attachments/assets/e2d56756-f9f7-4afd-980e-20d0f283d82f)

<strong>Welcome!</strong> This project contains multiple interactive links, visualizations, and games- all created by me.  
Visit the most recent deployment via Github Pages at [https://calebketterer.github.io/Calebs-Virtual-Compendium/](https://calebketterer.github.io/Calebs-Virtual-Compendium/).  
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.4.

## Features

<details>
  <summary><strong>Conway's Game of Life Simulator</strong></summary>

## Conway's Simulation

![Capture](https://github.com/user-attachments/assets/7e74d71d-86f0-4bb9-b631-e462ffae05fd)

Based off Cambridge mathematician John Conway's [Game of Life]([url](https://playgameoflife.com/)), this cellular automaton became widely known when it was mentioned in an article published by Scientific American in 1970. It consists of a grid of cells which, based on a few mathematical rules, can live, die or multiply. Depending on the initial conditions, the cells form various patterns throughout the course of the game.

The rules for each space: 
1. Each populated cell with one or no neighbors dies, as if by solitude.
2. Each populated cell with four or more neighbors dies, as if by overpopulation.
3. Each populated cell with two or three neighbors survives.
4. Each unpopulated cell with three neighbors becomes populated.
</details>

<details>
  <summary><strong>Sudoku</strong></summary>

## Classic Sudoku

![Capture](https://github.com/user-attachments/assets/3ecc467a-c761-4f6d-9aa0-3a57e965f9ab)

A classic game of Sudoku, featuring the following:

- Interactive Sudoku board with keyboard and mouse support.
- "Check Answers" button with error highlighting.
- "Reveal Solution" toggle to view or hide the solution.
- Random puzzle generation with unique solutions.
- Difficulty selection (Easy/Medium/Hard).

Challenge yourself or practice your puzzle-solving skills!

</details>

## Snake

![Capture](https://github.com/user-attachments/assets/2276d350-9edf-49fb-914a-412b22c7baa3)

## Development Server in Browser

Visit https://vscode.dev/. Log in to GitHub, then fork the repository. Under the explorer, select "Open Remote Repository" and select Calebs Virtual Compendium. Open Terminal and click "Continue Working in GitHub Codespaces." Install ng with the command line `npm install -g @angular/cli` in the codespace Terminal. Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. If you can not connect to the localhost, type `h + enter` then `o + enter` into Terminal to directly open this project in your browser.

<details>
  <summary><strong>Old Server Setup Instructions</strong></summary>
  
## Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help with setup

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
</details>

## Deploying as a Github Page

If not already done, type `npm install -g angular-cli-ghpages` in terminal. Then, run `ng build --configuration production --base-href /Calebs-Virtual-Compendium/` and  `npx angular-cli-ghpages --dir=dist/example-website/browser/`. After that, the site should be updated at `https://calebketterer.github.io/Calebs-Virtual-Compendium/`



