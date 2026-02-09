import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LockScreen } from './lock-screen';

describe('LockScreen', () => {
  let component: LockScreen;
  let fixture: ComponentFixture<LockScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LockScreen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
