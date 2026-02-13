<?php

namespace App\Controllers;

use App\Models\ProductosModel;
use App\Helpers\ResponseHelper;

class ProductosController
{
    private $productosModel;
    private $uploadDir = __DIR__ . '/../../public/uploads/productos/';

    public function __construct()
    {
        $this->productosModel = new ProductosModel();

        // Crear directorio si no existe
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
    }

    public function getAllProductos()
    {
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

    public function actualizarProducto(array $params)
    {
        try {
            $id = isset($params['id']) ? (int)$params['id'] : null;
            error_log("=== ACTUALIZAR PRODUCTO ID: $id ===");

            if (!$id) {
                ResponseHelper::error('ID de producto no válido', 400);
                return;
            }

            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            $data  = [];
            $files = [];

            if (str_contains($contentType, 'multipart/form-data')) {
                // Extraer boundary
                preg_match('/boundary=(.*)$/', $contentType, $matches);
                $boundary = $matches[1] ?? '';

                if ($boundary) {
                    [$data, $files] = $this->parseMultipartPut($boundary);
                }
            } else {
                $raw = file_get_contents('php://input');
                $data = str_contains($contentType, 'application/json')
                    ? (json_decode($raw, true) ?? [])
                    : [];
            }

            error_log("Datos parseados: " . json_encode($data));
            error_log("Archivos parseados: " . json_encode(array_keys($files)));

            // Manejar imagen si existe
            if (!empty($files['imagen'])) {
                $file = $files['imagen'];
                error_log("Imagen recibida, tamaño: " . strlen($file['content']) . " bytes");

                // Guardar en archivo temporal y procesar
                $tmpPath = tempnam(sys_get_temp_dir(), 'upload_');
                file_put_contents($tmpPath, $file['content']);

                $fileArray = [
                    'name'     => $file['name'],
                    'type'     => $file['type'],
                    'tmp_name' => $tmpPath,
                    'error'    => UPLOAD_ERR_OK,
                    'size'     => strlen($file['content'])
                ];

                // Eliminar imagen anterior
                $productoActual = $this->productosModel->getProductoById($id);
                if ($productoActual && !empty($productoActual['imagen_url'])) {
                    $rutaAnterior = $this->uploadDir . basename($productoActual['imagen_url']);
                    if (file_exists($rutaAnterior)) {
                        unlink($rutaAnterior);
                        error_log("Imagen anterior eliminada");
                    }
                }

                $imagenUrl = $this->guardarImagenDesdeArray($fileArray);
                if ($imagenUrl) {
                    $data['imagen_url'] = $imagenUrl;
                    error_log("Nueva imagen guardada: $imagenUrl");
                }

                unlink($tmpPath); // Limpiar temporal
            }

            // Filtrar solo campos permitidos
            $camposPermitidos = [
                'nombre',
                'categoria_id',
                'subcategoria_id',
                'marca_id',
                'proveedor_id',
                'talla',
                'color',
                'genero',
                'stock',
                'precio_compra',
                'precio_venta',
                'imagen_url',
                'estado'
            ];

            $dataFiltrada = array_intersect_key($data, array_flip($camposPermitidos));
            error_log("Datos finales a guardar: " . json_encode($dataFiltrada));

            if (empty($dataFiltrada)) {
                ResponseHelper::error('No se recibieron datos para actualizar', 400);
                return;
            }

            $resultado = $this->productosModel->updateProducto($id, $dataFiltrada);

            if ($resultado) {
                ResponseHelper::success(['id' => $id], 'Producto actualizado exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar el producto');
            }
        } catch (\Exception $e) {
            error_log("Error en actualizarProducto: " . $e->getMessage());
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    /**
     * Parsea multipart/form-data de una petición PUT
     * Retorna [$fields, $files]
     */
    private function parseMultipartPut(string $boundary): array
    {
        $rawInput = file_get_contents('php://input');
        $fields   = [];
        $files    = [];

        // Dividir por boundary
        $parts = explode('--' . $boundary, $rawInput);

        foreach ($parts as $part) {
            // Ignorar partes vacías y el cierre
            $part = ltrim($part, "\r\n");
            if ($part === '' || $part === "--\r\n" || $part === '--') continue;

            // Separar cabeceras del cuerpo
            $pos = strpos($part, "\r\n\r\n");
            if ($pos === false) continue;

            $headerSection = substr($part, 0, $pos);
            $body          = substr($part, $pos + 4);
            $body          = rtrim($body, "\r\n");

            // Parsear cabeceras
            $headers = [];
            foreach (explode("\r\n", $headerSection) as $line) {
                if (str_contains($line, ':')) {
                    [$key, $val] = explode(':', $line, 2);
                    $headers[strtolower(trim($key))] = trim($val);
                }
            }

            $disposition = $headers['content-disposition'] ?? '';

            // Obtener nombre del campo
            preg_match('/name="([^"]+)"/', $disposition, $nameMatch);
            $fieldName = $nameMatch[1] ?? null;
            if (!$fieldName) continue;

            // Verificar si es archivo
            preg_match('/filename="([^"]*)"/', $disposition, $fileMatch);

            if (!empty($fileMatch[1])) {
                // Es un archivo
                $files[$fieldName] = [
                    'name'    => $fileMatch[1],
                    'type'    => $headers['content-type'] ?? 'application/octet-stream',
                    'content' => $body,
                ];
            } else {
                // Es un campo normal
                $fields[$fieldName] = $body;
            }
        }
        return [$fields, $files];
    }

    /**
     * Guarda imagen desde un array simulado (para PUT)
     */
    private function guardarImagenDesdeArray(array $file): string|false
    {
        $tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

        if (!in_array($file['type'], $tiposPermitidos)) {
            error_log("Tipo no permitido: " . $file['type']);
            return false;
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            error_log("Archivo muy grande: " . $file['size']);
            return false;
        }

        $extension    = pathinfo($file['name'], PATHINFO_EXTENSION);
        $nombreArchivo = uniqid('producto_') . '.' . $extension;
        $rutaCompleta  = $this->uploadDir . $nombreArchivo;

        if (copy($file['tmp_name'], $rutaCompleta)) {
            return '/uploads/productos/' . $nombreArchivo;
        }

        error_log("Error al copiar imagen a: $rutaCompleta");
        return false;
    }
    public function deleteProducto(array $params)
    {
        try {
            $id = isset($params['id']) ? (int)$params['id'] : null;
            // Eliminar imagen asociada si existe
            $producto = $this->productosModel->getProductoById($id);
            if ($producto && !empty($producto['imagen_url'])) {
                $rutaImagen = __DIR__ . '/../../public' . $producto['imagen_url'];
                if (file_exists($rutaImagen)) {
                    unlink($rutaImagen);
                }
            }

            $resultado = $this->productosModel->deleteProducto($id);

            if ($resultado) {
                ResponseHelper::success(['id' => $id], 'Producto eliminado exitosamente');
            } else {
                ResponseHelper::error('No se pudo eliminar el producto');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }
}
