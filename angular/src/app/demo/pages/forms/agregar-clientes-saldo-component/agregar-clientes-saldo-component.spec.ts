import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarClientesSaldoComponent } from './agregar-clientes-saldo-component';

describe('AgregarClientesSaldoComponent', () => {
  let component: AgregarClientesSaldoComponent;
  let fixture: ComponentFixture<AgregarClientesSaldoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarClientesSaldoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarClientesSaldoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
