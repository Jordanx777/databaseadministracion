import {
  Component,
  ViewChild,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Material
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-proveedores-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatDialogModule,
  ],
  templateUrl: './proveedores-component.html',
  styleUrl: './proveedores-component.scss',
})
export class ProveedoresComponent implements AfterViewInit {

  displayedColumns: string[] = [
    'nombre',
    'nit',
    'correo',
    'telefono',
    'ciudad',
    'estado',
    'acciones',
  ];

  dataSource = new MatTableDataSource<Proveedor>(PROVEEDORES_DATA);

  editarForm!: FormGroup;
  proveedorSeleccionado!: Proveedor;

  dialogRef!: MatDialogRef<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('editarProveedorDialog') editarProveedorDialog!: TemplateRef<any>;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  agregarProveedor(): void {
    this.router.navigate(['/addproveedor']);
  }

  editarProveedor(row: Proveedor): void {
    this.proveedorSeleccionado = row;

    this.editarForm = this.fb.group({
      nombre: [row.nombre, Validators.required],
      nit: [row.nit, Validators.required],
      correo: [row.correo, [Validators.required, Validators.email]],
      telefono: [row.telefono, Validators.required],
      ciudad: [row.ciudad, Validators.required],
      estado: [row.estado, Validators.required],
    });

    this.dialogRef = this.dialog.open(this.editarProveedorDialog, {
      width: '500px',
    });
  }

  guardarEdicion(): void {
    if (this.editarForm.invalid) return;

    Object.assign(this.proveedorSeleccionado, this.editarForm.value);
    this.dataSource._updateChangeSubscription(); // refresca tabla
    this.dialogRef.close();
  }

  cerrarDialog(): void {
    this.dialogRef.close();
  }

  eliminarProveedor(row: Proveedor): void {
    console.log('Eliminar proveedor:', row);
  }
}

/* ================= INTERFACE ================= */
export interface Proveedor {
  nombre: string;
  nit: string;
  correo: string;
  telefono: string;
  ciudad: string;
  estado: 'activo' | 'inactivo';
}

/* ================= DATA MOCK ================= */
const PROVEEDORES_DATA: Proveedor[] = [
  {
    nombre: 'Distribuidora ABC',
    nit: '900123456',
    correo: 'contacto@abc.com',
    telefono: '3001234567',
    ciudad: 'Cartagena',
    estado: 'activo',
  },
  {
    nombre: 'Proveedor XYZ',
    nit: '901987654',
    correo: 'ventas@xyz.com',
    telefono: '3019876543',
    ciudad: 'Barranquilla',
    estado: 'inactivo',
  },
];
