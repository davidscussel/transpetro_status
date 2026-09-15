import { Component, Input } from '@angular/core';
import { Materia, StudyProgress, TopicView } from '../../models/study.models';
import { DashboardStateService } from '../../services/dashboard-state.service';
@Component({ selector: 'app-charts-panel', standalone: true, templateUrl: './charts-panel.component.html', styleUrl: './charts-panel.component.css' })
export class ChartsPanelComponent {
  @Input() materias: Materia[] = []; @Input() progress: StudyProgress = { topics: {}, questions: {} };
  constructor(private readonly state: DashboardStateService) {}
  get topics(): TopicView[] { return this.state.getAllTopics(this.materias).sort((a, b) => b.freq - a.freq).slice(0, 7); }
  get maxFreq(): number { return Math.max(...this.topics.map((topic) => topic.freq), 1); }
  get completed(): number { return this.state.stats(this.materias, this.progress).doneQuestions; }
  get total(): number { return this.state.stats(this.materias, this.progress).totalQuestions; }
  width(topic: TopicView): number { return topic.freq * 100 / this.maxFreq; }
}
