import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Conge } from './conge';

describe('Conge', () => {
  let service: Conge;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(Conge);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
