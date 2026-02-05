import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientesSaldoComponent } from './clientes-saldo-component';

describe('ClientesSaldoComponent', () => {
  let component: ClientesSaldoComponent;
  let fixture: ComponentFixture<ClientesSaldoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientesSaldoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientesSaldoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
