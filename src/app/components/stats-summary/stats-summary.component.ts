import { Component, Input } from '@angular/core';
import { DashboardStats } from '../../models/study.models';
@Component({ selector: 'app-stats-summary', standalone: true, templateUrl: './stats-summary.component.html', styleUrl: './stats-summary.component.css' })
export class StatsSummaryComponent { @Input({ required: true }) stats!: DashboardStats; }
