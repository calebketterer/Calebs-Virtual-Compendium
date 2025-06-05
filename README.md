# Caleb's Virtual Compendium

![Capture](https://github.com/user-attachments/assets/ad0ac5aa-d2bb-4d06-af09-8abc915d98e2)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Development server in browser

Visit https://vscode.dev/. Log in to GitHub, then fork the repository. Under the explorer, select "Open Remote Repository" and select Calebs Virtual Compendium. Open Terminal and click "Continue Working in GitHub Codespaces." Install ng with the command line `npm install -g @angular/cli` in the codespace Terminal. Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. If you can not connect to the localhost, type `h + enter` then `o + enter` into Terminal to directly open this project in your browser.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Conway's Simulation

![Capture](https://github.com/user-attachments/assets/6ccf45ca-c79d-4bd6-81b5-221c2aad75da)

Based off Cambridge mathematician John Conway's [Game of Life]([url](https://playgameoflife.com/)), this cellular automaton became widely known when it was mentioned in an article published by Scientific American in 1970. It consists of a grid of cells which, based on a few mathematical rules, can live, die or multiply. Depending on the initial conditions, the cells form various patterns throughout the course of the game.

The rules for a space that is populated: 
1. Each cell with one or no neighbors dies, as if by solitude.
2. Each cell with four or more neighbors dies, as if by overpopulation.
3. Each cell with two or three neighbors survives.

The rule for a space that is empty or unpopulated:
4. Each cell with three neighbors becomes populated.
