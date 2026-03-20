import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaDetailComponent } from './cuenta-detail.component';

describe('CuentaDetailComponent', () => {
  let component: CuentaDetailComponent;
  let fixture: ComponentFixture<CuentaDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentaDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentaDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
