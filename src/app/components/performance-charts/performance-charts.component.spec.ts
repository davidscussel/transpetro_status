import { TestBed } from '@angular/core/testing';
import { PerformanceChartsComponent } from './performance-charts.component';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { Materia, StudyProgress } from '../../models/study.models';

describe('PerformanceChartsComponent', () => {
  const question = { qid: '1', prova: 'T', ano: 2023, q: 1, d: 'medio' as const, link: '#' };
  const materias: Materia[] = [{ materia: 'M', assuntos: ['A', 'B', 'C', 'D'].map((nome, i) => ({
    nome, freq: 1, pdfUrl: '#', questions: [{ ...question, q: i + 1, qid: '' + (i + 1) }],
  })) }];
  const state = new DashboardStateService();

  it('renders 10% intervals and shows an empty relative chart without fabricated radar points', () => {
    const fixture = TestBed.createComponent(PerformanceChartsComponent);
    fixture.componentRef.setInput('materias', materias);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.radar-ring').length).toBe(10);
    expect(Array.from(root.querySelectorAll('.radar-tick')).map(el => el.textContent?.trim())).toEqual(['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%', '100%']);
    expect(root.querySelectorAll('.radar-point').length).toBe(0);
    expect(root.textContent).toContain('Responda uma questão');
    expect(root.querySelectorAll('tbody tr').length).toBe(4);
    fixture.destroy();
  });

  it('does not connect across unanswered axes and includes real zero percent results', () => {
    const fixture = TestBed.createComponent(PerformanceChartsComponent);
    const progress: StudyProgress = { topics: {}, questions: {
      [state.questionKey('M', 'A', 'T', 1)]: { done: false, selectedAnswer: 'B', correctAnswer: 'B' },
      [state.questionKey('M', 'B', 'T', 2)]: { done: false, selectedAnswer: 'A', correctAnswer: 'B' },
      [state.questionKey('M', 'D', 'T', 4)]: { done: false, selectedAnswer: 'A', correctAnswer: 'B' },
    } };
    fixture.componentRef.setInput('materias', materias);
    fixture.componentRef.setInput('progress', progress);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.radar-point').length).toBe(3);
    expect(root.querySelectorAll('.radar-result').length).toBe(2);
    expect(root.textContent).toContain('33,3%');
    expect(root.textContent).toContain('66,7%');
    const zeros = root.querySelectorAll('circle[cx="480"][cy="480"]');
    expect(zeros.length).toBe(2);
    fixture.componentRef.setInput('progress', { topics: {}, questions: {} });
    fixture.detectChanges();
    expect(root.querySelectorAll('.radar-point').length).toBe(0);
    fixture.destroy();
  });
});
