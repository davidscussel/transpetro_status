import { Component, Input } from '@angular/core';
@Component({ selector: 'app-progress-ring', standalone: true, templateUrl: './progress-ring.component.html', styleUrl: './progress-ring.component.css' })
export class ProgressRingComponent { @Input() pct = 0; readonly radius = 27; readonly circumference = 2 * Math.PI * this.radius; get offset(): number { return this.circumference * (1 - Math.min(100, Math.max(0, this.pct)) / 100); } }
