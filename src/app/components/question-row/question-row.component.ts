import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DifficultyLevel, Questao } from '../../models/study.models';
@Component({ selector: 'app-question-row', standalone: true, templateUrl: './question-row.component.html', styleUrl: './question-row.component.css' })
export class QuestionRowComponent { @Input({ required: true }) question!: Questao; @Input() done = false; @Input() selectedDifficulty?: DifficultyLevel; @Output() doneChange = new EventEmitter<boolean>(); @Output() difficultyChange = new EventEmitter<DifficultyLevel | undefined>(); }
