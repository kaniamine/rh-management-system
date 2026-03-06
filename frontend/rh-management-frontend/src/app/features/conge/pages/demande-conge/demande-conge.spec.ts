import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandeConge } from './demande-conge';

describe('DemandeConge', () => {
  let component: DemandeConge;
  let fixture: ComponentFixture<DemandeConge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandeConge],
    }).compileComponents();

    fixture = TestBed.createComponent(DemandeConge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
