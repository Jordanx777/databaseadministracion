import {
  Component,
  ViewChild,
  AfterViewInit,
  TemplateRef,
  OnInit,
  ChangeDetectorRef,
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject } from 'rxjs';

// Servicios
import { ProductosService } from 'src/app/@theme/services/Productos.service';

export interface Proveedor {
  id?: number;
  nombre: string;
  observaciones?: string;
  nit: string;
  correo: string;
  telefono?: string;
  ciudad?: string;
  estado?: boolean;
  fecha_llegada?: string;
  created_at?: string;
}

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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './proveedores-component.html',
  styleUrl: './proveedores-component.scss',
})
export class ProveedoresComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'nombre',
    'nit',
    'correo',
    'telefono',
    'ciudad',
    'estado',
    'acciones',
  ];

  dataSource = new MatTableDataSource<Proveedor>();

  editarForm!: FormGroup;
  proveedorSeleccionado!: Proveedor;
  dialogRef!: MatDialogRef<any>;

  // ✅ BehaviorSubject expuesto como observable para usar con async pipe
  cargando$ = new BehaviorSubject<boolean>(false);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('editarProveedorDialog') editarProveedorDialog!: TemplateRef<any>;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private productosService: ProductosService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /** CARGAR PROVEEDORES */
  cargarProveedores(): void {
    this.cargando$.next(true);

    this.productosService.getProveedores().subscribe({
      next: (response) => {
        const proveedores = this.extraerDatos(response);
        this.dataSource.data = proveedores;
        // ✅ setTimeout evita el ExpressionChangedAfterChecked
        setTimeout(() => {
          this.cargando$.next(false);
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
        this.mostrarMensaje('Error al cargar los proveedores', 'error');
        setTimeout(() => {
          this.cargando$.next(false);
          this.cdr.detectChanges();
        });
      }
    });
  }

  /** EXTRAER DATOS DE LA RESPUESTA */
  private extraerDatos(response: any): any[] {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    return [];
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  agregarProveedor(): void {
    this.router.navigate(['/component/addproveedor']);
  }

  /** EDITAR PROVEEDOR */
  editarProveedor(row: Proveedor): void {
    this.proveedorSeleccionado = { ...row };

    this.editarForm = this.fb.group({
      nombre:        [row.nombre,        Validators.required],
      nit:           [row.nit,           Validators.required],
      correo:        [row.correo,        [Validators.required, Validators.email]],
      telefono:      [row.telefono],
      ciudad:        [row.ciudad],
      observaciones: [row.observaciones],
      estado:        [row.estado ?? true, Validators.required],
    });

    this.dialogRef = this.dialog.open(this.editarProveedorDialog, {
      width: '600px',
      disableClose: true,
    });
  }

  /** GUARDAR EDICIÓN */
  guardarEdicion(): void {
    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    this.cargando$.next(true);
    const datosActualizados = this.editarForm.value;

    this.productosService.actualizarProveedor(this.proveedorSeleccionado.id!, datosActualizados).subscribe({
      next: (response) => {
        if (this.verificarExito(response)) {
          this.mostrarMensaje('Proveedor actualizado exitosamente', 'success');
          this.dialogRef.close();
          this.cargarProveedores();
        } else {
          this.mostrarMensaje(response.message || 'Error al actualizar proveedor', 'error');
        }
        setTimeout(() => {
          this.cargando$.next(false);
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al actualizar el proveedor', 'error');
        setTimeout(() => {
          this.cargando$.next(false);
          this.cdr.detectChanges();
        });
      }
    });
  }

  private verificarExito(response: any): boolean {
    if (!response) return false;
    if (response.hasOwnProperty('success')) return response.success === true;
    if (response.id || response.data?.id) return true;
    return true;
  }

  cerrarDialog(): void {
    this.dialogRef.close();
  }

  /** ELIMINAR PROVEEDOR */
  eliminarProveedor(row: Proveedor): void {
    if (!confirm(`¿Está seguro de eliminar el proveedor "${row.nombre}"?`)) {
      return;
    }

    this.cargando$.next(true);

    this.productosService.eliminarProveedor(row.id!).subscribe({
      next: (response) => {
        if (this.verificarExito(response)) {
          this.mostrarMensaje('Proveedor eliminado exitosamente', 'success');
          this.cargarProveedores();
        } else {
          this.mostrarMensaje(response.message || 'Error al eliminar proveedor', 'error');
          setTimeout(() => {
            this.cargando$.next(false);
            this.cdr.detectChanges();
          });
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al eliminar el proveedor', 'error');
        setTimeout(() => {
          this.cargando$.next(false);
          this.cdr.detectChanges();
        });
      }
    });
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}