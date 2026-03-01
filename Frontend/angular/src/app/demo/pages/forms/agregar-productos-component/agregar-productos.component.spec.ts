import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarProductosComponent } from './agregar-productos.component';

describe('AgregarProductoscomponent', () => {
  let component: AgregarProductosComponent;
  let fixture: ComponentFixture<AgregarProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarProductosComponent]
    })
    .compileComponents();
    /*uno */

    fixture = TestBed.createComponent(AgregarProductosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
