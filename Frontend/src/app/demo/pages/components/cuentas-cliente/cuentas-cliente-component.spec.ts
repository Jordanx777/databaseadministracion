import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cuentaclientecomponent } from './cuentas-cliente-component';

describe('CuentaClienteComponent', () => {
  let component: Cuentaclientecomponent;
  let fixture: ComponentFixture<Cuentaclientecomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cuentaclientecomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cuentaclientecomponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
