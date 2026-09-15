import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DifficultyLevel, StudyProgress, SubjectGroupView, TopicView } from '../../models/study.models';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { TopicItemComponent } from '../topic-item/topic-item.component';
@Component({ selector: 'app-subject-group', standalone: true, imports: [TopicItemComponent], templateUrl: './subject-group.component.html', styleUrl: './subject-group.component.css' })
export class SubjectGroupComponent implements OnChanges {
  @Input({ required: true }) group!: SubjectGroupView; @Input({ required: true }) progress!: StudyProgress; @Input() search = ''; @Input() expandAllOpen = true; @Input() expandAllVersion = 0; @Output() topicDone = new EventEmitter<{ topic: TopicView; done: boolean }>(); @Output() questionDone = new EventEmitter<{ key: string; done: boolean }>(); @Output() difficultyChanged = new EventEmitter<{ key: string; difficulty: DifficultyLevel | undefined }>(); open = true;
  constructor(private readonly state: DashboardStateService) {}
  ngOnChanges(changes: SimpleChanges): void { if (changes['expandAllVersion']) this.open = this.expandAllOpen; }
  get completed(): number { return this.group.assuntos.filter((topic) => this.progress.topics[this.state.topicKey(topic.materiaName, topic.nome)]?.done).length; }
}
