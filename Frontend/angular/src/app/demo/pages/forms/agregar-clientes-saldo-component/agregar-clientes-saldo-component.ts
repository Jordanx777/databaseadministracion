import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { RouterModule } from '@angular/router';

/* ===== ANGULAR MATERIAL ===== */
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-agregar-clientes-saldo-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './agregar-clientes-saldo-component.html',
  styleUrl: './agregar-clientes-saldo-component.scss',
})
export class AgregarClientesSaldoComponent implements OnInit {

  formClienteSaldo!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.crearFormulario();
    this.escucharCambios();
  }

  /* ===== FORMULARIO ===== */
  crearFormulario(): void {
    this.formClienteSaldo = this.fb.group({
      deudor: ['', Validators.required],
      productos: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      total: [0, [Validators.required, Validators.min(0)]],
      abono: [0, [Validators.min(0)]],
      saldo: [{ value: 0, disabled: true }],
      estado: ['Pendiente', Validators.required]
    });
  }

  /* ===== CALCULAR SALDO AUTOMÁTICO ===== */
  escucharCambios(): void {
    this.formClienteSaldo.valueChanges.subscribe(values => {
      const total = values.total || 0;
      const abono = values.abono || 0;
      const saldo = total - abono;

      this.formClienteSaldo.patchValue(
        {
          saldo: saldo < 0 ? 0 : saldo,
          estado:
            saldo <= 0
              ? 'Pagado'
              : abono > 0
              ? 'Parcial'
              : 'Pendiente'
        },
        { emitEvent: false }
      );
    });
  }

  /* ===== GUARDAR ===== */
  guardar(): void {
    if (this.formClienteSaldo.invalid) {
      this.formClienteSaldo.markAllAsTouched();
      return;
    }

    const clienteSaldo = this.formClienteSaldo.getRawValue();

    console.log('Cliente con saldo:', clienteSaldo);

    // 🔜 Próximo paso:
    // - Enviar al backend
    // - O agregar directamente a la tabla de pagos pendientes
  }
}
