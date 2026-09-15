import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DifficultyLevel, SortMode, StudyProgress, SubjectGroupView, TopicView } from '../../models/study.models';
import { SubjectGroupComponent } from '../subject-group/subject-group.component';
import { TopicItemComponent } from '../topic-item/topic-item.component';
@Component({ selector: 'app-subject-list', standalone: true, imports: [SubjectGroupComponent, TopicItemComponent], templateUrl: './subject-list.component.html', styleUrl: './subject-list.component.css' })
export class SubjectListComponent { @Input() groups: SubjectGroupView[] = []; @Input() flatTopics: TopicView[] = []; @Input() sort: SortMode = 'area'; @Input({ required: true }) progress!: StudyProgress; @Input() search = ''; @Input() expandAllOpen = true; @Input() expandAllVersion = 0; @Output() topicDone = new EventEmitter<{ topic: TopicView; done: boolean }>(); @Output() questionDone = new EventEmitter<{ key: string; done: boolean }>(); @Output() difficultyChanged = new EventEmitter<{ key: string; difficulty: DifficultyLevel | undefined }>(); }
