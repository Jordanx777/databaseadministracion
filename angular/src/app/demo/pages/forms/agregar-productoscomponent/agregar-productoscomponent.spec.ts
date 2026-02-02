import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarProductoscomponent } from './agregar-productoscomponent';

describe('AgregarProductoscomponent', () => {
  let component: AgregarProductoscomponent;
  let fixture: ComponentFixture<AgregarProductoscomponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarProductoscomponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarProductoscomponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
