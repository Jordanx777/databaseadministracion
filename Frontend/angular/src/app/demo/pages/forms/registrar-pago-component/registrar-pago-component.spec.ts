import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarPagoComponent } from './registrar-pago-component';

describe('RegistrarPagoComponent', () => {
  let component: RegistrarPagoComponent;
  let fixture: ComponentFixture<RegistrarPagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarPagoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrarPagoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
