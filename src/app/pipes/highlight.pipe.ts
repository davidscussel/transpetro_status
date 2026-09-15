import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}
  transform(value: string, term: string): SafeHtml {
    const escaped = value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] ?? char));
    const query = term.trim();
    if (!query) return escaped;
    const index = this.indexOfNormalized(value, query);
    if (index < 0) return escaped;
    const end = index + query.length;
    return this.sanitizer.bypassSecurityTrustHtml(escaped.slice(0, index) + '<mark>' + escaped.slice(index, end) + '</mark>' + escaped.slice(end));
  }
  private indexOfNormalized(value: string, term: string): number {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().indexOf(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
  }
}
