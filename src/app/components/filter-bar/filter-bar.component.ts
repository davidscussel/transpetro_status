import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DifficultyFilter, SortMode } from '../../models/study.models';
@Component({ selector: 'app-filter-bar', standalone: true, imports: [FormsModule], templateUrl: './filter-bar.component.html', styleUrl: './filter-bar.component.css' })
export class FilterBarComponent { @Input() search = ''; @Input() difficulty: DifficultyFilter = 'todas'; @Input() sort: SortMode = 'area'; @Output() searchChange = new EventEmitter<string>(); @Output() difficultyChange = new EventEmitter<DifficultyFilter>(); @Output() sortChange = new EventEmitter<SortMode>(); }
