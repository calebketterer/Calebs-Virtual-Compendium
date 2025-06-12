import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SudokuComponent } from './sudoku/sudoku.component';
import { ConwayComponent } from './conway/conway.component';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CommonModule, FormsModule, SudokuComponent, ConwayComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'ExampleWebsite';
    selectedView: string = '';

    messageBoxText: string = "Click on cells to toggle them, then press Start!";
    messageBoxClass: string = "p-3 bg-blue-100 text-blue-800 rounded-md text-sm w-full text-center";

    onViewChange(event: Event): void {
        this.selectedView = (event.target as HTMLSelectElement).value;
    }
}