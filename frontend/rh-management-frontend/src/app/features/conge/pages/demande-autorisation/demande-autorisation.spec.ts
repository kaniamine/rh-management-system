import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandeAutorisation } from './demande-autorisation';

describe('DemandeAutorisation', () => {
  let component: DemandeAutorisation;
  let fixture: ComponentFixture<DemandeAutorisation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandeAutorisation],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DemandeAutorisation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
