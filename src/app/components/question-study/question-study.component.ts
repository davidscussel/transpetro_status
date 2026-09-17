import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { AnswerOption, Questao, QuestionMaterial, StudyTab } from '../../models/study.models';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuestionAnswerService } from '../../services/question-answer.service';
import { StudyProgressService } from '../../services/study-progress.service';
import { QuestionMaterialService } from '../../services/question-material.service';

@Component({
  selector: 'app-question-study',
  standalone: true,
  templateUrl: './question-study.component.html',
  styleUrl: './question-study.component.css',
})
export class QuestionStudyComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) question!: Questao;
  @Input() tab: StudyTab = 'theory';
  @Input() progressKey = '';
  @Output() dismissed = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('content', { static: true }) content!: ElementRef<HTMLElement>;
  private readonly service = inject(QuestionMaterialService);
  private readonly answers = inject(QuestionAnswerService);
  private readonly progress = inject(StudyProgressService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly options: AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];
  readonly tabs: StudyTab[] = ['question', 'theory', 'solution'];
  correctAnswer?: AnswerOption;
  pdfUrl?: SafeResourceUrl;
  get selectedAnswer(): AnswerOption | undefined { return this.progress.progress().questions[this.progressKey]?.selectedAnswer; }

  answer(option?: AnswerOption): void {
    if (this.progressKey && this.correctAnswer && !this.loading && !this.error) {
      this.progress.answerQuestion(this.progressKey, option, this.correctAnswer);
    }
  }
  private subscription?: Subscription;
  private previousFocus?: HTMLElement;
  private previousOverflow = '';
  material?: QuestionMaterial;
  loading = true;
  error = false;

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement as HTMLElement;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.dialog.nativeElement.showModal();
    // Schedule after the first view check, including when the material is cached.
    queueMicrotask(() => { if (this.dialog.nativeElement.isConnected) this.load(); });
  }

  load(): void {
    this.subscription?.unsubscribe();
    this.loading = true;
    this.error = false;
    if (this.tab === 'question') {
      // Only locally published question PDFs are trusted as frame resources.
      this.pdfUrl = /^assets\/questoes\/\d+\.pdf$/.test(this.question.link)
        ? this.sanitizer.bypassSecurityTrustResourceUrl(this.question.link + '#navpanes=0&view=FitH') : undefined;
      this.subscription = this.answers.getAnswer(this.question).subscribe({
        next: answer => { this.correctAnswer = answer; this.loading = false; },
        error: () => { this.correctAnswer = undefined; this.error = true; this.loading = false; },
      });
      return;
    }
    if (!this.question.materialUrl) { this.loading = false; return; }
    this.subscription = this.service.getMaterial(this.question).subscribe({
      next: (material) => { this.material = material; this.loading = false; },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  selectTab(tab: StudyTab): void {
    this.tab = tab;
    this.content.nativeElement.scrollTop = 0;
    this.load();
  }

  navigateTabs(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = this.tabs.indexOf(this.tab);
    this.selectTab(event.key === 'Home' ? 'question' : event.key === 'End' ? 'solution' : this.tabs[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3]);
    this.dialog.nativeElement.querySelector<HTMLButtonElement>('#study-tab-' + this.tab)?.focus();
  }

  close(event?: Event): void {
    event?.preventDefault();
    this.dialog.nativeElement.close();
    this.dismissed.emit();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.dialog.nativeElement.close();
    document.body.style.overflow = this.previousOverflow;
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true });
  }
}
