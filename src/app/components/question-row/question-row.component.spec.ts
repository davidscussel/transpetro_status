import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Questao } from '../../models/study.models';
import { QuestionRowComponent } from './question-row.component';
import { StudyProgressService } from '../../services/study-progress.service';

const question: Questao = { qid: '2697782', prova: 'Transpetro 2023', ano: 2023, q: 48, d: 'medio', link: 'assets/questoes/2697782.pdf', materialUrl: 'data/microcontroladores_estudo.json' };
const material = { qid: question.qid, title: 'PWM', theory: [{ title: 'Teoria do PWM', paragraphs: ['Ciclo de trabalho'] }], steps: [{ title: 'Substituir os dados', paragraphs: ['64/256 = 0,25'] }], answer: 'B — 25%', sources: [] };

describe('QuestionRowComponent study actions', () => {
  let fixture: ComponentFixture<QuestionRowComponent>;
  let http: HttpTestingController;
  let root: HTMLElement;
  const click = (selector: string) => {
    const button = root.querySelector<HTMLElement>(selector)!;
    button.focus();
    button.click();
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [QuestionRowComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(QuestionRowComponent);
    fixture.componentRef.setInput('question', question);
    fixture.componentRef.setInput('progressKey', 'test-key');
    fixture.detectChanges();
    root = fixture.nativeElement;
  });
  afterEach(() => { http.verify(); fixture.destroy(); });

  it('keeps other subjects and their PDF links unchanged', () => {
    fixture.componentRef.setInput('question', { ...question, materialUrl: undefined });
    fixture.detectChanges();
    expect(root.querySelector('[aria-label="Abrir questão 48"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Abrir teoria da questão 48"]')).toBeNull();
    expect(root.querySelector('a')?.getAttribute('href')).toBe(question.link);
    http.expectNone(question.materialUrl!);
  });

  it('answers in the PDF tab, updates the result, clears and preserves manual completion', fakeAsync(() => {
    const progress = TestBed.inject(StudyProgressService);
    progress.markQuestion('test-key', true);
    click('[aria-label="Abrir questão 48"]');
    http.expectOne(question.materialUrl!).flush([material]);
    fixture.detectChanges();
    expect(root.querySelector('iframe')?.getAttribute('src')).toBe(question.link + '#navpanes=0&view=FitH');
    expect(root.querySelectorAll('input[type=radio]').length).toBe(5);
    click('input[value=B]');
    expect(root.textContent).toContain('Acertou!');
    expect(progress.progress().questions['test-key'].selectedAnswer).toBe('B');
    click('input[value=A]');
    expect(root.textContent).toContain('Errou.');
    click('#study-tab-solution');
    expect(root.textContent).toContain('Gabarito: B — 25%');
    click('#study-tab-question');
    expect(root.querySelector<HTMLInputElement>('input[value=A]')?.checked).toBeTrue();
    const clear = Array.from(root.querySelectorAll('button')).find(b => b.textContent === 'Limpar resposta')!;
    clear.click();
    fixture.detectChanges();
    expect(progress.progress().questions['test-key'].selectedAnswer).toBeUndefined();
    expect(progress.progress().questions['test-key'].done).toBeTrue();
    click('.close');
  }));

  it('answers questions without study material and navigates all three tabs', fakeAsync(() => {
    fixture.componentRef.setInput('question', { ...question, materialUrl: undefined });
    fixture.detectChanges();
    click('[aria-label="Abrir questão 48"]');
    http.expectOne('data/gabaritos.json').flush({ [question.qid]: 'C' });
    fixture.detectChanges();
    click('input[value=C]');
    expect(root.textContent).toContain('Acertou!');
    click('#study-tab-theory');
    expect(root.textContent).toContain('ainda indisponível');
    root.querySelector('#study-tab-theory')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement?.id).toBe('study-tab-question');
    expect(root.querySelector<HTMLInputElement>('input[value=C]')?.checked).toBeTrue();
    click('.close');
  }));

  it('disables answers on failure and retries without saving a result', fakeAsync(() => {
    click('[aria-label="Abrir questão 48"]');
    http.expectOne(question.materialUrl!).flush('', { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(root.querySelector('fieldset')?.disabled).toBeTrue();
    expect(TestBed.inject(StudyProgressService).progress().questions['test-key']).toBeUndefined();
    click('#study-panel button');
    http.expectOne(question.materialUrl!).flush([material]);
    fixture.detectChanges();
    expect(root.querySelector('fieldset')?.disabled).toBeFalse();
    click('.close');
  }));

  it('opens theory without revealing the answer, switches by keyboard and restores focus on Escape', fakeAsync(() => {
    const trigger = root.querySelector<HTMLButtonElement>('[aria-label="Abrir teoria da questão 48"]')!;
    click('[aria-label="Abrir teoria da questão 48"]');
    expect(root.querySelector('dialog')?.open).toBeTrue();
    expect(root.textContent).toContain('Carregando');
    http.expectOne(question.materialUrl!).flush([material]);
    fixture.detectChanges();
    expect(root.textContent).toContain('Teoria do PWM');
    expect(root.textContent).not.toContain('Gabarito:');
    const theoryTab = root.querySelector<HTMLElement>('#study-tab-theory')!;
    theoryTab.focus();
    theoryTab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(root.textContent).toContain('Gabarito: B — 25%');
    expect(document.activeElement?.id).toBe('study-tab-solution');
    root.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
    fixture.detectChanges();
    expect(root.querySelector('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).not.toBe('hidden');
  }));

  it('opens solution directly, retries errors and reopens cached theory without changing progress', fakeAsync(() => {
    const done = spyOn(fixture.componentInstance.doneChange, 'emit');
    const difficulty = spyOn(fixture.componentInstance.difficultyChange, 'emit');
    click('[aria-label="Abrir resolução da questão 48"]');
    http.expectOne(question.materialUrl!).flush('', { status: 500, statusText: 'Failure' });
    fixture.detectChanges();
    expect(root.textContent).toContain('Não foi possível');
    click('#study-panel button');
    http.expectOne(question.materialUrl!).flush([material]);
    fixture.detectChanges();
    expect(root.textContent).toContain('Gabarito: B — 25%');
    click('.close');
    click('[aria-label="Abrir teoria da questão 48"]');
    http.expectNone(question.materialUrl!);
    expect(root.textContent).toContain('Teoria do PWM');
    expect(root.textContent).not.toContain('Gabarito:');
    expect(done).not.toHaveBeenCalled();
    expect(difficulty).not.toHaveBeenCalled();
    click('.close');
  }));
});
