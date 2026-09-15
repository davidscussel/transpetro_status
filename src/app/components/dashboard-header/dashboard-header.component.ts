import { Component, Input } from '@angular/core';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
@Component({ selector: 'app-dashboard-header', standalone: true, imports: [ProgressRingComponent], templateUrl: './dashboard-header.component.html', styleUrl: './dashboard-header.component.css' })
export class DashboardHeaderComponent { @Input() completedPct = 0; @Input({ required: true }) pdfPath = ''; }
