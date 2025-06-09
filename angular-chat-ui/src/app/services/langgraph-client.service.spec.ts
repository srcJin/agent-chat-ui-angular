import { TestBed } from '@angular/core/testing';

import { LanggraphClientService } from './langgraph-client.service';

describe('LanggraphClientService', () => {
  let service: LanggraphClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanggraphClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
