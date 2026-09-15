import { TestBed } from '@angular/core/testing';
import { StudyProgressService } from './study-progress.service';
describe('StudyProgressService', () => { beforeEach(() => { localStorage.clear(); TestBed.resetTestingModule(); }); it('stores completed questions', () => { const service = TestBed.inject(StudyProgressService); service.markQuestion('q1', true); expect(service.progress().questions['q1'].done).toBeTrue(); }); });
