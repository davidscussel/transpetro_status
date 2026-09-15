import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Questao, QuestionMaterial, StudyTab } from '../../models/study.models';
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
  @Output() dismissed = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('content', { static: true }) content!: ElementRef<HTMLElement>;
  private readonly service = inject(QuestionMaterialService);
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
    this.subscription = this.service.getMaterial(this.question).subscribe({
      next: (material) => { this.material = material; this.loading = false; },
      error: () => { this.error = true; this.loading = false; },
    });
  }

  selectTab(tab: StudyTab): void {
    this.tab = tab;
    this.content.nativeElement.scrollTop = 0;
  }

  navigateTabs(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    this.selectTab(event.key === 'Home' ? 'theory' : event.key === 'End' ? 'solution' : this.tab === 'theory' ? 'solution' : 'theory');
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
