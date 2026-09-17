import { Component, Input, OnChanges, inject } from '@angular/core';
import { AnswerStats, Materia, StudyProgress, TopicAnswerStats } from '../../models/study.models';
import { DashboardStateService } from '../../services/dashboard-state.service';

@Component({
  selector: 'app-performance-charts',
  standalone: true,
  templateUrl: './performance-charts.component.html',
  styleUrl: './performance-charts.component.css',
})
export class PerformanceChartsComponent implements OnChanges {
  @Input() materias: Materia[] = [];
  @Input() progress: StudyProgress = { topics: {}, questions: {} };
  private readonly state = inject(DashboardStateService);
  stats: AnswerStats = { correct: 0, incorrect: 0, unanswered: 0, answered: 0, total: 0 };
  topics: TopicAnswerStats[] = [];
  readonly ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  readonly green = '#24834e';
  readonly red = '#c14636';
  readonly gray = '#cbd5d8';
  absoluteBackground = '';
  relativeBackground = '';
  segments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  ngOnChanges(): void {
    this.stats = this.state.answerStats(this.materias, this.progress);
    this.topics = this.state.topicAnswerStats(this.materias, this.progress);
    this.absoluteBackground = this.pie(this.stats.total);
    this.relativeBackground = this.pie(this.stats.answered);
    this.segments = [];
    if (this.topics.length < 2) return;
    this.topics.forEach((topic, index) => {
      const nextIndex = (index + 1) % this.topics.length;
      const next = this.topics[nextIndex];
      if (topic.percentage === null || next.percentage === null) return;
      const a = this.point(index, topic.percentage), b = this.point(nextIndex, next.percentage);
      this.segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    });
  }

  point(index: number, percentage: number): { x: number; y: number } {
    const angle = index * 2 * Math.PI / Math.max(this.topics.length, 1) - Math.PI / 2;
    return { x: 480 + Math.cos(angle) * 310 * percentage / 100, y: 480 + Math.sin(angle) * 310 * percentage / 100 };
  }

  ring(percentage: number): string {
    return this.topics.map((_, index) => {
      const p = this.point(index, percentage);
      return p.x + ',' + p.y;
    }).join(' ');
  }

  percent(value: number, total: number): string {
    return (total ? value * 100 / total : 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  }

  label(topic: TopicAnswerStats, index: number): string {
    return (index + 1) + '. ' + (topic.name.length > 18 ? topic.name.slice(0, 17) + '…' : topic.name);
  }

  anchor(index: number): string {
    return this.point(index, 100).x < 480 ? 'end' : 'start';
  }

  labelTransform(index: number): string {
    const point = this.point(index, 106);
    const angle = index * 360 / Math.max(this.topics.length, 1) - 90 + (point.x < 480 ? 180 : 0);
    return 'rotate(' + angle + ' ' + point.x + ' ' + point.y + ')';
  }

  private pie(total: number): string {
    if (!total) return this.gray;
    const correct = this.stats.correct * 100 / total;
    const answered = (this.stats.correct + this.stats.incorrect) * 100 / total;
    return 'conic-gradient(' + this.green + ' 0% ' + correct + '%, ' + this.red + ' ' + correct + '% ' + answered + '%, ' + this.gray + ' ' + answered + '% 100%)';
  }
}
