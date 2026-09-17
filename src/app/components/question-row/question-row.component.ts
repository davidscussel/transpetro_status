import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DifficultyLevel, Questao, StudyTab } from '../../models/study.models';
import { QuestionStudyComponent } from '../question-study/question-study.component';

@Component({
  selector: 'app-question-row',
  standalone: true,
  imports: [QuestionStudyComponent],
  templateUrl: './question-row.component.html',
  styleUrl: './question-row.component.css',
})
export class QuestionRowComponent {
  @Input({ required: true }) question!: Questao;
  @Input() done = false;
  @Input() progressKey = '';
  @Input() selectedDifficulty?: DifficultyLevel;
  @Output() doneChange = new EventEmitter<boolean>();
  @Output() difficultyChange = new EventEmitter<DifficultyLevel | undefined>();
  studyTab?: StudyTab;
}
