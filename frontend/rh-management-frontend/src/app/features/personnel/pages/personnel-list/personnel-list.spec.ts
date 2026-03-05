import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonnelList } from './personnel-list';

describe('PersonnelList', () => {
  let component: PersonnelList;
  let fixture: ComponentFixture<PersonnelList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonnelList],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonnelList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
