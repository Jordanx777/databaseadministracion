// src/app/modules/categorias/components/categorias-gestion/categorias-gestion.component.ts

import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

/* Angular Material */
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';

/* Servicios */
import { CategoriasService } from 'src/app/@theme/services/Categorias.service';
import { SubcategoriasService } from 'src/app/@theme/services/Subcategorias.service';

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  subcategorias?: Subcategoria[];
}

interface Subcategoria {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number;
}

@Component({
  selector: 'app-categorias-gestion',
  standalone: true,
  templateUrl: './categorias-subcategorias.html',
  styleUrls: ['./categorias-subcategorias.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule,
    MatSelectModule,
  ]
})
export class CategoriasGestionComponent implements OnInit {

  @ViewChild('modalCategoria') modalCategoria!: TemplateRef<any>;
  @ViewChild('modalSubcategoria') modalSubcategoria!: TemplateRef<any>;

  categorias: Categoria[] = [];
  cargando = true;
  
  // Formularios
  formCategoria!: FormGroup;
  formSubcategoria!: FormGroup;
  
  // Estado de modales
  dialogRefCategoria!: MatDialogRef<any>;
  dialogRefSubcategoria!: MatDialogRef<any>;
  
  // Modo de edición
  modoEdicion = false;
  categoriaSeleccionada: Categoria | null = null;
  subcategoriaSeleccionada: Subcategoria | null = null;
  
  // Loading states
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private categoriasService: CategoriasService,
    private subcategoriasService: SubcategoriasService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.crearFormularios();
  }

  ngOnInit(): void {
    this.cargarCategorias();
  }

  // ─── FORMULARIOS ───────────────────────────────────────────────────────────

  crearFormularios(): void {
    this.formCategoria = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });

    this.formSubcategoria = this.fb.group({
      categoria_id: ['', Validators.required],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['']
    });
  }

  // ─── CARGAR DATOS ──────────────────────────────────────────────────────────

  cargarCategorias(): void {
    setTimeout(() => {
        this.cargando = true;
        this.cdr.detectChanges();
      });
    
    this.categoriasService.getCategorias().subscribe({
      next: (response: any) => {
        const categorias = this.extraerDatos(response);
        
        // Cargar subcategorías para cada categoría
        this.cargarSubcategoriasPorCategoria(categorias);
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al cargar categorías', 'error');
        this.cargando = false;
      }
    });
  }

  private cargarSubcategoriasPorCategoria(categorias: Categoria[]): void {
    const requests = categorias.map(cat => 
      this.subcategoriasService.getSubcategoriasPorCategoria(cat.id).toPromise()
    );

    Promise.all(requests).then(responses => {
      responses.forEach((response: any, index) => {
        categorias[index].subcategorias = this.extraerDatos(response);
      });
      
      this.categorias = categorias;
      setTimeout(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      });
    }).catch(error => {
      console.error('Error al cargar subcategorías:', error);
      this.categorias = categorias;
      this.cargando = false;
    });
  }

  private extraerDatos(response: any): any[] {
    if (response?.data) return Array.isArray(response.data) ? response.data : [];
    if (Array.isArray(response)) return response;
    return [];
  }

  // ─── CATEGORÍAS: CRUD ──────────────────────────────────────────────────────

  abrirModalCategoria(categoria?: Categoria): void {
    this.modoEdicion = !!categoria;
    this.categoriaSeleccionada = categoria || null;

    if (categoria) {
      this.formCategoria.patchValue({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion
      });
    } else {
      this.formCategoria.reset();
    }

    this.dialogRefCategoria = this.dialog.open(this.modalCategoria, {
      width: '500px',
      disableClose: false
    });
  }

  guardarCategoria(): void {
    if (this.formCategoria.invalid) {
      this.formCategoria.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const datos = this.formCategoria.value;

    const request = this.modoEdicion
      ? this.categoriasService.updateCategoria(this.categoriaSeleccionada!.id, datos)
      : this.categoriasService.createCategoria(datos);

    request.subscribe({
      next: () => {
        this.mostrarMensaje(
          this.modoEdicion ? 'Categoría actualizada' : 'Categoría creada',
          'success'
        );
        this.cerrarModalCategoria();
        this.cargarCategorias();
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al guardar categoría', 'error');
        this.guardando = false;
      }
    });
  }

  eliminarCategoria(categoria: Categoria): void {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"? Se eliminarán también sus subcategorías.`)) {
      return;
    }

    this.categoriasService.deleteCategoria(categoria.id).subscribe({
      next: () => {
        this.mostrarMensaje('Categoría eliminada', 'success');
        this.cargarCategorias();
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al eliminar categoría', 'error');
      }
    });
  }

  cerrarModalCategoria(): void {
    this.dialogRefCategoria?.close();
    this.formCategoria.reset();
    this.categoriaSeleccionada = null;
  }

  // ─── SUBCATEGORÍAS: CRUD ───────────────────────────────────────────────────

  abrirModalSubcategoria(categoria: Categoria, subcategoria?: Subcategoria): void {
    this.modoEdicion = !!subcategoria;
    this.subcategoriaSeleccionada = subcategoria || null;
    this.categoriaSeleccionada = categoria;

    if (subcategoria) {
      this.formSubcategoria.patchValue({
        categoria_id: categoria.id,
        nombre: subcategoria.nombre,
        descripcion: subcategoria.descripcion
      });
    } else {
      this.formSubcategoria.patchValue({
        categoria_id: categoria.id,
        nombre: '',
        descripcion: ''
      });
    }

    this.dialogRefSubcategoria = this.dialog.open(this.modalSubcategoria, {
      width: '500px',
      disableClose: false
    });
  }

  guardarSubcategoria(): void {
    if (this.formSubcategoria.invalid) {
      this.formSubcategoria.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const datos = this.formSubcategoria.value;

    const request = this.modoEdicion
      ? this.subcategoriasService.updateSubcategoria(this.subcategoriaSeleccionada!.id, datos)
      : this.subcategoriasService.createSubcategoria(datos);

    request.subscribe({
      next: () => {
        this.mostrarMensaje(
          this.modoEdicion ? 'Subcategoría actualizada' : 'Subcategoría creada',
          'success'
        );
        this.cerrarModalSubcategoria();
        this.cargarCategorias();
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al guardar subcategoría', 'error');
        this.guardando = false;
      }
    });
  }

  eliminarSubcategoria(subcategoria: Subcategoria): void {
    if (!confirm(`¿Eliminar la subcategoría "${subcategoria.nombre}"?`)) {
      return;
    }

    this.subcategoriasService.deleteSubcategoria(subcategoria.id).subscribe({
      next: () => {
        this.mostrarMensaje('Subcategoría eliminada', 'success');
        this.cargarCategorias();
      },
      error: (error) => {
        console.error('Error:', error);
        this.mostrarMensaje('Error al eliminar subcategoría', 'error');
      }
    });
  }

  cerrarModalSubcategoria(): void {
    this.dialogRefSubcategoria?.close();
    this.formSubcategoria.reset();
    this.subcategoriaSeleccionada = null;
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}