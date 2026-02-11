<?php
namespace App\Controllers;
use App\Models\ProductosModel;
use App\Helpers\ResponseHelper;

class ProductosController {
    private $productosModel;
    private $uploadDir = __DIR__ . '/../../public/uploads/productos/';

    public function __construct() {
        $this->productosModel = new ProductosModel();
        
        // Crear directorio si no existe
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
    }

    public function getAllProductos() {
        try {
            $productos = $this->productosModel->getAllProductos();
            ResponseHelper::success($productos, 'Productos obtenidos exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    public function crearProducto()
    {
        try {
            // Obtener datos del formulario
            $data = $_POST;
            error_log("Datos recibidos: " . json_encode($data));

            if (empty($data)) {
                ResponseHelper::error('No se recibieron datos para crear el producto', 400);
                return;
            }

            $camposRequeridos = ['nombre', 'categoria_id', 'marca_id', 'talla', 'color', 'stock', 'precio_compra', 'precio_venta', 'proveedor_id'];
            foreach ($camposRequeridos as $campo) {
                if (!isset($data[$campo]) || $data[$campo] === '') {
                    ResponseHelper::error("El campo '$campo' es obligatorio", 400);
                    return;
                }
            }

            // Manejar la imagen
            $imagenUrl = null;
            if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
                $imagenUrl = $this->guardarImagen($_FILES['imagen']);
                if (!$imagenUrl) {
                    ResponseHelper::error('Error al guardar la imagen', 500);
                    return;
                }
                $data['imagen_url'] = $imagenUrl;
            }

            $id = $this->productosModel->createProducto($data);

            if ($id) {
                ResponseHelper::created(['id' => $id, 'imagen_url' => $imagenUrl], 'Producto creado exitosamente');
            } else {
                ResponseHelper::error('No se pudo crear el producto');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    private function guardarImagen($file)
    {
        try {
            // Validar tipo de archivo
            $tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!in_array($file['type'], $tiposPermitidos)) {
                return false;
            }

            // Validar tamaño (5MB máximo)
            if ($file['size'] > 5 * 1024 * 1024) {
                return false;
            }

            // Generar nombre único
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $nombreArchivo = uniqid('producto_') . '.' . $extension;
            $rutaCompleta = $this->uploadDir . $nombreArchivo;

            // Mover archivo
            if (move_uploaded_file($file['tmp_name'], $rutaCompleta)) {
                // Retornar ruta relativa para la BD
                return '/uploads/productos/' . $nombreArchivo;
            }

            return false;
        } catch (\Exception $e) {
            error_log("Error al guardar imagen: " . $e->getMessage());
            return false;
        }
    }

    public function actualizarProducto($id)
    {
        try {
            $data = $_POST;
            
            // Manejar la imagen si se envió una nueva
            if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
                // Eliminar imagen anterior si existe
                $productoActual = $this->productosModel->getProductoById($id);
                if ($productoActual && !empty($productoActual['imagen_url'])) {
                    $rutaAnterior = __DIR__ . '/../../public' . $productoActual['imagen_url'];
                    if (file_exists($rutaAnterior)) {
                        unlink($rutaAnterior);
                    }
                }
                
                $imagenUrl = $this->guardarImagen($_FILES['imagen']);
                if ($imagenUrl) {
                    $data['imagen_url'] = $imagenUrl;
                }
            }

            $resultado = $this->productosModel->updateProducto($id, $data);

            if ($resultado) {
                ResponseHelper::success(['id' => $id], 'Producto actualizado exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar el producto');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}
?>