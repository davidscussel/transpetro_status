import { DashboardStateService } from './dashboard-state.service';
import { Materia } from '../models/study.models';
const materias: Materia[] = [{ materia: 'Português', assuntos: [{ nome: 'Crase', freq: 4, questions: [{ prova: 'T1', ano: 2023, q: 1, d: 'facil', link: '#' }] }] }];
describe('DashboardStateService', () => { const service = new DashboardStateService(); it('filters without accents', () => { expect(service.getFilteredGroups(materias, 'crase', 'todas').length).toBe(1); }); it('computes question progress', () => { const key = service.questionKey('Português', 'Crase', 'T1', 1); expect(service.stats(materias, { topics: {}, questions: { [key]: { done: true } } }).completedPct).toBe(100); }); });
