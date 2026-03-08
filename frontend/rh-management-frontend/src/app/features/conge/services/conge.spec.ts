import { TestBed } from '@angular/core/testing';

import { Conge } from './conge';

describe('Conge', () => {
  let service: Conge;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Conge);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
