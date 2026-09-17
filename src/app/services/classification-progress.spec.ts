import { TestBed } from '@angular/core/testing';
import { Materia, Questao, StudyProgress } from '../models/study.models';
import { StudyProgressService } from './study-progress.service';

const storageKey = 'transpetro_study_progress_v1';
const oldSignals = 'Engenharia Elétrica e Eletrônica::Análise de Sinais e Sistemas';
const oldTransforms = 'Engenharia Elétrica e Eletrônica::Transformadas';
const suffix = (n: number) => '::Transpetro 2018::' + n;
const question = (n: number, aliases: string[]): Questao => ({
  qid: String(n), prova: 'Transpetro 2018', ano: 2018, q: n, d: 'medio', link: '', legacyTopicKeys: aliases,
});
const materias: Materia[] = [
  { materia: 'Controle', assuntos: [{ nome: 'Estabilidade', freq: 1, pdfUrl: '', questions: [question(72, [oldSignals])] }] },
  { materia: 'Sinais', assuntos: [
    { nome: 'Transformada Z', freq: 1, pdfUrl: '', questions: [question(71, [oldSignals])] },
    { nome: 'Laplace', freq: 2, pdfUrl: '', questions: [question(77, [oldSignals]), question(170, [oldTransforms])] },
  ] },
];

function serviceWith(progress: StudyProgress): StudyProgressService {
  localStorage.setItem(storageKey, JSON.stringify(progress));
  return TestBed.inject(StudyProgressService);
}

describe('Classification progress migration', () => {
  beforeEach(() => { localStorage.clear(); TestBed.resetTestingModule(); });

  it('preserves answers, difficulty, completion, notes and the original entries when a question moves', () => {
    const oldKey = oldSignals + suffix(72);
    const entry = { done: true, difficulty: 'dificil' as const, selectedAnswer: 'B' as const, correctAnswer: 'D' as const };
    const note = { text: 'Revisar os polos', updatedAt: '2026-01-01' };
    const service = serviceWith({ topics: {}, questions: { [oldKey]: entry }, notes: { [oldKey]: note }, goal: { weeklyHours: 8 } });
    service.reconcileClassification(materias);
    const saved = JSON.parse(localStorage.getItem(storageKey)!);
    expect(saved.questions['Controle::Estabilidade' + suffix(72)]).toEqual(entry);
    expect(saved.questions[oldKey]).toEqual(entry);
    expect(saved.notes['Controle::Estabilidade' + suffix(72)]).toEqual(note);
    expect(saved.goal.weeklyHours).toBe(8);
  });

  it('inherits split topics but does not mark a partially complete merge as complete', () => {
    const service = serviceWith({ topics: { [oldSignals]: { done: true }, [oldTransforms]: { done: false } }, questions: {} });
    service.reconcileClassification(materias);
    expect(service.progress().topics['Controle::Estabilidade'].done).toBeTrue();
    expect(service.progress().topics['Sinais::Transformada Z'].done).toBeTrue();
    expect(service.progress().topics['Sinais::Laplace'].done).toBeFalse();
    expect(service.progress().questions).toEqual({});
  });

  it('marks a merge complete when all of its source topics are complete', () => {
    const service = serviceWith({ topics: { [oldSignals]: { done: true }, [oldTransforms]: { done: true } }, questions: {} });
    service.reconcileClassification(materias);
    expect(service.progress().topics['Sinais::Laplace'].done).toBeTrue();
  });

  it('supports both historical Electronics locations and gives the more recent entry priority', () => {
    const recent = 'Eletrônica::Diodos', older = 'Engenharia Elétrica e Eletrônica::Diodos';
    const service = serviceWith({ topics: { [recent]: { done: false }, [older]: { done: true } }, questions: {
      [older + suffix(27)]: { done: true, difficulty: 'facil' },
    } });
    service.reconcileClassification([{ materia: 'Eletrônica', assuntos: [{ nome: 'Zener', freq: 1, pdfUrl: '', questions: [question(27, [recent, older])] }] }]);
    expect(service.progress().topics['Eletrônica::Zener'].done).toBeFalse();
    expect(service.progress().questions['Eletrônica::Zener' + suffix(27)].difficulty).toBe('facil');
  });

  it('runs once and preserves new answers and explicit unmarking across reloads', () => {
    const newKey = 'Controle::Estabilidade' + suffix(72);
    const service = serviceWith({ topics: { [oldSignals]: { done: true } }, questions: { [oldSignals + suffix(72)]: { done: true } } });
    service.reconcileClassification(materias);
    service.markQuestion(newKey, false);
    service.markTopic('Controle::Estabilidade', false);
    service.answerQuestion(newKey, 'A', 'D');
    TestBed.resetTestingModule();
    const restored = TestBed.inject(StudyProgressService);
    restored.reconcileClassification(materias);
    expect(restored.progress().questions[newKey]).toEqual({ done: false, selectedAnswer: 'A', correctAnswer: 'D' });
    expect(restored.progress().topics['Controle::Estabilidade'].done).toBeFalse();
    restored.reset();
    restored.reconcileClassification(materias);
    expect(restored.progress().questions).toEqual({});
    expect(restored.progress().topics).toEqual({});
  });
});
