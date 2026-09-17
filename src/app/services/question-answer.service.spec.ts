import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Questao } from '../models/study.models';
import { QuestionAnswerService } from './question-answer.service';

describe('QuestionAnswerService', () => {
  let service: QuestionAnswerService;
  let http: HttpTestingController;
  const question: Questao = { qid: '1', prova: 'T', ano: 2023, q: 1, d: 'medio', link: 'assets/questoes/1.pdf' };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(QuestionAnswerService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the same answer field as the solution without fetching fallback data', () => {
    service.getAnswer({ ...question, materialUrl: 'data/material.json' }).subscribe(answer => expect(answer).toBe('B'));
    http.expectOne('data/material.json').flush([{ qid: '1', answer: 'B — 25%', theory: [{}], steps: [{}] }]);
    http.expectNone('data/gabaritos.json');
  });

  it('loads fallback by qid and shares the answer file', () => {
    service.getAnswer(question).subscribe(answer => expect(answer).toBe('E'));
    http.expectOne('data/gabaritos.json').flush({ '1': 'E', '2': 'A' });
    service.getAnswer({ ...question, qid: '2' }).subscribe(answer => expect(answer).toBe('A'));
    http.expectNone('data/gabaritos.json');
  });

  it('rejects missing or invalid answers and allows reloading corrected data', () => {
    const failed = jasmine.createSpy('failed');
    service.getAnswer(question).subscribe({ error: failed });
    http.expectOne('data/gabaritos.json').flush({ '1': 'Alternativa desconhecida' });
    expect(failed).toHaveBeenCalled();
    service.getAnswer(question).subscribe(answer => expect(answer).toBe('C'));
    http.expectOne('data/gabaritos.json').flush({ '1': 'C' });
  });
});
