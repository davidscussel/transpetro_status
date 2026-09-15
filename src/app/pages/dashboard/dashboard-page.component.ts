import { Component, computed, inject, signal } from '@angular/core';
import { DashboardHeaderComponent } from '../../components/dashboard-header/dashboard-header.component';
import { StatsSummaryComponent } from '../../components/stats-summary/stats-summary.component';
import { ChartsPanelComponent } from '../../components/charts-panel/charts-panel.component';
import { FilterBarComponent } from '../../components/filter-bar/filter-bar.component';
import { SubjectListComponent } from '../../components/subject-list/subject-list.component';
import { DifficultyFilter, DifficultyLevel, Materia, SortMode, TopicView } from '../../models/study.models';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { StudyDataService } from '../../services/study-data.service';
import { StudyProgressService } from '../../services/study-progress.service';

@Component({ selector: 'app-dashboard-page', standalone: true, imports: [DashboardHeaderComponent, StatsSummaryComponent, ChartsPanelComponent, FilterBarComponent, SubjectListComponent], templateUrl: './dashboard-page.component.html', styleUrl: './dashboard-page.component.css' })
export class DashboardPageComponent {
  private readonly data = inject(StudyDataService);
  private readonly progressService = inject(StudyProgressService);
  private readonly state = inject(DashboardStateService);
  materias = signal<Materia[]>([]); loading = signal(true); error = signal(false); search = signal(''); difficulty = signal<DifficultyFilter>('todas'); sort = signal<SortMode>('area'); expandAllOpen = signal(true); expandAllVersion = signal(0); readonly progress = this.progressService.progress; readonly stats = computed(() => this.state.stats(this.materias(), this.progress())); readonly groups = computed(() => this.state.getFilteredGroups(this.materias(), this.search(), this.difficulty())); readonly flatTopics = computed(() => this.state.getFlatSorted(this.materias(), this.search(), this.difficulty(), this.sort())); readonly pdfPath = 'assets/caderno-ultimas-provas-transpetro.pdf';
  constructor() { this.data.getMaterias().subscribe({ next: (materias) => { this.materias.set(materias); this.loading.set(false); }, error: () => { this.error.set(true); this.loading.set(false); } }); }
  toggleExpandAll(): void { this.expandAllOpen.update((open) => !open); this.expandAllVersion.update((version) => version + 1); }
  resetProgress(): void { if (confirm('Limpar todo o progresso salvo neste navegador?')) this.progressService.reset(); }
  markTopic(event: { topic: TopicView; done: boolean }): void { this.progressService.markTopic(this.state.topicKey(event.topic.materiaName, event.topic.nome), event.done); }
  markQuestion(event: { key: string; done: boolean }): void { this.progressService.markQuestion(event.key, event.done); }
  setDifficulty(event: { key: string; difficulty: DifficultyLevel | undefined }): void { this.progressService.setDifficulty(event.key, event.difficulty); }
}
