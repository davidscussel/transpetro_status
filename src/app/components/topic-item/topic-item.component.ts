import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DifficultyLevel, StudyProgress, TopicView } from '../../models/study.models';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { HighlightPipe } from '../../pipes/highlight.pipe';
import { QuestionRowComponent } from '../question-row/question-row.component';
@Component({ selector: 'app-topic-item', standalone: true, imports: [HighlightPipe, QuestionRowComponent], templateUrl: './topic-item.component.html', styleUrl: './topic-item.component.css' })
export class TopicItemComponent {
  @Input({ required: true }) topic!: TopicView; @Input({ required: true }) progress!: StudyProgress; @Input() search = ''; @Output() topicDone = new EventEmitter<boolean>(); @Output() questionDone = new EventEmitter<{ key: string; done: boolean }>(); @Output() difficultyChanged = new EventEmitter<{ key: string; difficulty: DifficultyLevel | undefined }>();
  constructor(private readonly state: DashboardStateService) {}
  get key(): string { return this.state.topicKey(this.topic.materiaName, this.topic.nome); }
  questionKey(question: TopicView['questions'][number]): string { return this.state.questionKey(this.topic.materiaName, this.topic.nome, question.prova, question.q); }
  isQuestionDone(question: TopicView['questions'][number]): boolean { return Boolean(this.progress.questions[this.questionKey(question)]?.done); }
  difficulty(question: TopicView['questions'][number]): DifficultyLevel | undefined { return this.progress.questions[this.questionKey(question)]?.difficulty; }
}
