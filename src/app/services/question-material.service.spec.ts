import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Questao, QuestionMaterial } from '../models/study.models';
import { QuestionMaterialService } from './question-material.service';

const question: Questao = { qid: '2697782', prova: 'Transpetro 2023', ano: 2023, q: 48, d: 'medio', link: 'assets/questoes/2697782.pdf', materialUrl: 'data/microcontroladores_estudo.json' };
const material: QuestionMaterial = { qid: question.qid, title: 'PWM', theory: [{ title: 'Conceito', paragraphs: ['Ciclo de trabalho'] }], steps: [{ title: 'Calcular', paragraphs: ['64/256'] }], answer: 'B — 25%', sources: [] };

describe('QuestionMaterialService', () => {
  let http: HttpTestingController;
  let service: QuestionMaterialService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(QuestionMaterialService);
  });
  afterEach(() => http.verify());

  it('loads lazily and selects by qid, sharing a cached topic file', () => {
    http.expectNone(question.materialUrl!);
    const other = { ...material, qid: '2697789', title: 'Memória' };
    service.getMaterial(question).subscribe((value) => expect(value).toEqual(material));
    http.expectOne(question.materialUrl!).flush([other, material]);
    service.getMaterial({ ...question, qid: other.qid }).subscribe((value) => expect(value).toEqual(other));
    http.expectNone(question.materialUrl!);
  });

  it('allows retry after a network failure', () => {
    const failed = jasmine.createSpy('failed');
    service.getMaterial(question).subscribe({ error: failed });
    http.expectOne(question.materialUrl!).flush('', { status: 503, statusText: 'Unavailable' });
    expect(failed).toHaveBeenCalled();
    service.getMaterial(question).subscribe((value) => expect(value.answer).toBe('B — 25%'));
    http.expectOne(question.materialUrl!).flush([material]);
  });

  it('never substitutes another question when content is missing, and can retry', () => {
    const failed = jasmine.createSpy('failed');
    service.getMaterial(question).subscribe({ error: failed });
    http.expectOne(question.materialUrl!).flush([{ ...material, qid: 'different' }]);
    expect(failed).toHaveBeenCalled();
    service.getMaterial(question).subscribe((value) => expect(value.qid).toBe(question.qid));
    http.expectOne(question.materialUrl!).flush([material]);
  });
});
