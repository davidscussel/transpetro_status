import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StudyDataService } from './study-data.service';

describe('StudyDataService', () => {
  it('uses local PDFs and preserves question identities for saved progress', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(StudyDataService).getMaterias().subscribe((materias) => {
      const topic = materias[0].assuntos[0];
      expect(topic.pdfUrl).toBe('assets/assuntos/sinais.pdf');
      expect(topic.questions[0]).toEqual({
        prova: 'Transpetro 2023', ano: 2023, q: 66, d: 'medio', link: 'assets/questoes/2697791.pdf',
      });
      expect(topic.nome).toBe('Análise de Sinais e Sistemas');
      expect(topic.freq).toBe(1);
    });
    http.expectOne('data/materias.json').flush([{
      materia: 'Engenharia Elétrica e Eletrônica',
      assuntos: [{
        name: 'Análise de Sinais e Sistemas', count: 1, pdfUrl: 'assets/assuntos/sinais.pdf',
        questions: [{ num: 66, qid: '2697791', ano: '2023',
          url: 'https://www.tecconcursos.com.br/questoes/2697791', pdfUrl: 'assets/questoes/2697791.pdf' }],
      }],
    }]);
    http.verify();
  });
});
