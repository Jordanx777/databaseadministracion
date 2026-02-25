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
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL
    // ─────────────────────────────────────────────────────────────────────────
    public function getAllProductos()
    {
        try {
            $productos = $this->productosModel->getAllProductos();
            ResponseHelper::success($productos, 'Productos obtenidos exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH
    public function searchProductos()
{
    try {
        $query = $_GET['query'] ?? '';
        
        // ✅ Si está vacío, devolver todos los productos
        if (empty(trim($query))) {
            return $this->getAllProductos();
        }
        
        $productos = $this->productosModel->searchProductos($query);
        ResponseHelper::success($productos, 'Productos encontrados');
    } catch (\Exception $e) {
        ResponseHelper::error($e->getMessage(), 500);
    }
}

    // ─────────────────────────────────────────────────────────────────────────
    // GET ONE
    // ─────────────────────────────────────────────────────────────────────────
    public function getProductoById(array $params)
    {
        try {
            $id = isset($params['id']) ? (int)$params['id'] : null;
            if (!$id) { ResponseHelper::error('ID no válido', 400); return; }

            $producto = $this->productosModel->getProductoById($id);
            if (!$producto) { ResponseHelper::error('Producto no encontrado', 404); return; }

            $producto['variantes'] = $this->productosModel->getVariantesByProducto($id);
            ResponseHelper::success($producto, 'Producto obtenido exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREAR
    // ─────────────────────────────────────────────────────────────────────────
    public function crearProducto()
    {
        try {
            $data = $_POST;
            if (empty($data)) { ResponseHelper::error('No se recibieron datos', 400); return; }

            // ✅ Campos requeridos del padre — sin talla, color, genero, stock
            $camposRequeridos = ['nombre', 'categoria_id', 'marca_id', 'precio_compra', 'precio_venta', 'proveedor_id'];
            foreach ($camposRequeridos as $campo) {
                if (!isset($data[$campo]) || $data[$campo] === '') {
                    ResponseHelper::error("El campo '$campo' es obligatorio", 400);
                    return;
                }
            }

            // Validar variantes
            if (empty($data['variantes'])) {
                ResponseHelper::error('Debe incluir al menos una variante', 400);
                return;
            }
            $variantes = json_decode($data['variantes'], true);
            if (!is_array($variantes) || count($variantes) === 0) {
                ResponseHelper::error('Las variantes no tienen un formato válido', 400);
                return;
            }
            // ✅ Cada variante debe tener talla, color, genero y stock
            foreach ($variantes as $i => $v) {
                if (empty($v['talla']) || empty($v['color']) || empty($v['genero']) || !isset($v['stock'])) {
                    ResponseHelper::error("La variante #" . ($i + 1) . " requiere talla, color, género y stock", 400);
                    return;
                }
            }

            // Imagen
            $imagenUrl = null;
            if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
                $imagenUrl = $this->guardarImagen($_FILES['imagen']);
                if (!$imagenUrl) { ResponseHelper::error('Error al guardar la imagen', 500); return; }
                $data['imagen_url'] = $imagenUrl;
            }

            $id = $this->productosModel->createProducto($data, $variantes);

            if ($id) {
                ResponseHelper::created(['id' => $id, 'imagen_url' => $imagenUrl], 'Producto creado exitosamente');
            } else {
                ResponseHelper::error('No se pudo crear el producto');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTUALIZAR
    // ─────────────────────────────────────────────────────────────────────────
    public function actualizarProducto(array $params)
    {
        try {
            $id = isset($params['id']) ? (int)$params['id'] : null;
            if (!$id) { ResponseHelper::error('ID de producto no válido', 400); return; }

            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            $data = []; $files = [];

            if (str_contains($contentType, 'multipart/form-data')) {
                preg_match('/boundary=(.*)$/', $contentType, $matches);
                $boundary = $matches[1] ?? '';
                if ($boundary) [$data, $files] = $this->parseMultipartPut($boundary);
            } else {
                $raw  = file_get_contents('php://input');
                $data = str_contains($contentType, 'application/json')
                    ? (json_decode($raw, true) ?? [])
                    : [];
            }

            // Imagen
            if (!empty($files['imagen'])) {
                $file    = $files['imagen'];
                $tmpPath = tempnam(sys_get_temp_dir(), 'upload_');
                file_put_contents($tmpPath, $file['content']);

                $fileArray = [
                    'name' => $file['name'], 'type' => $file['type'],
                    'tmp_name' => $tmpPath, 'error' => UPLOAD_ERR_OK,
                    'size' => strlen($file['content'])
                ];

                $productoActual = $this->productosModel->getProductoById($id);
                if ($productoActual && !empty($productoActual['imagen_url'])) {
                    $rutaAnterior = $this->uploadDir . basename($productoActual['imagen_url']);
                    if (file_exists($rutaAnterior)) unlink($rutaAnterior);
                }

                $imagenUrl = $this->guardarImagenDesdeArray($fileArray);
                if ($imagenUrl) $data['imagen_url'] = $imagenUrl;
                unlink($tmpPath);
            }

            // Extraer variantes
            $variantes = null;
            if (isset($data['variantes'])) {
                $variantes = json_decode($data['variantes'], true);
                if (!is_array($variantes) || count($variantes) === 0) {
                    ResponseHelper::error('Las variantes no tienen un formato válido', 400);
                    return;
                }
                // ✅ Validar genero en cada variante
                foreach ($variantes as $i => $v) {
                    if (empty($v['talla']) || empty($v['color']) || empty($v['genero']) || !isset($v['stock'])) {
                        ResponseHelper::error("La variante #" . ($i + 1) . " requiere talla, color, género y stock", 400);
                        return;
                    }
                }
                unset($data['variantes']);
            }

            // ✅ Campos permitidos del padre — sin genero, talla, color, stock
            $camposPermitidos = [
                'nombre', 'categoria_id', 'subcategoria_id', 'marca_id',
                'proveedor_id', 'precio_compra', 'precio_venta', 'imagen_url', 'estado'
            ];
            $dataFiltrada = array_intersect_key($data, array_flip($camposPermitidos));

            if (empty($dataFiltrada) && $variantes === null) {
                ResponseHelper::error('No se recibieron datos para actualizar', 400);
                return;
            }

            $resultado = $this->productosModel->updateProducto($id, $dataFiltrada, $variantes);

            if ($resultado) {
                ResponseHelper::success(['id' => $id], 'Producto actualizado exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar el producto');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────
    public function deleteProducto(array $params)
    {
        try {
            $id = isset($params['id']) ? (int)$params['id'] : null;

            $producto = $this->productosModel->getProductoById($id);
            if ($producto && !empty($producto['imagen_url'])) {
                $rutaImagen = __DIR__ . '/../../public' . $producto['imagen_url'];
                if (file_exists($rutaImagen)) unlink($rutaImagen);
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

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS PRIVADOS
    // ─────────────────────────────────────────────────────────────────────────
    private function guardarImagen(array $file): string|false
    {
        $tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!in_array($file['type'], $tiposPermitidos)) return false;
        if ($file['size'] > 5 * 1024 * 1024) return false;
        $extension     = pathinfo($file['name'], PATHINFO_EXTENSION);
        $nombreArchivo = uniqid('producto_') . '.' . $extension;
        return move_uploaded_file($file['tmp_name'], $this->uploadDir . $nombreArchivo)
            ? '/uploads/productos/' . $nombreArchivo : false;
    }

    private function guardarImagenDesdeArray(array $file): string|false
    {
        $tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!in_array($file['type'], $tiposPermitidos)) return false;
        if ($file['size'] > 5 * 1024 * 1024) return false;
        $extension     = pathinfo($file['name'], PATHINFO_EXTENSION);
        $nombreArchivo = uniqid('producto_') . '.' . $extension;
        return copy($file['tmp_name'], $this->uploadDir . $nombreArchivo)
            ? '/uploads/productos/' . $nombreArchivo : false;
    }

    private function parseMultipartPut(string $boundary): array
    {
        $rawInput = file_get_contents('php://input');
        $fields = []; $files = [];
        $parts  = explode('--' . $boundary, $rawInput);

        foreach ($parts as $part) {
            $part = ltrim($part, "\r\n");
            if ($part === '' || $part === "--\r\n" || $part === '--') continue;
            $pos = strpos($part, "\r\n\r\n");
            if ($pos === false) continue;

            $headerSection = substr($part, 0, $pos);
            $body          = rtrim(substr($part, $pos + 4), "\r\n");

            $headers = [];
            foreach (explode("\r\n", $headerSection) as $line) {
                if (str_contains($line, ':')) {
                    [$key, $val] = explode(':', $line, 2);
                    $headers[strtolower(trim($key))] = trim($val);
                }
            }

            $disposition = $headers['content-disposition'] ?? '';
            preg_match('/name="([^"]+)"/', $disposition, $nameMatch);
            $fieldName = $nameMatch[1] ?? null;
            if (!$fieldName) continue;

            preg_match('/filename="([^"]*)"/', $disposition, $fileMatch);
            if (!empty($fileMatch[1])) {
                $files[$fieldName] = [
                    'name' => $fileMatch[1],
                    'type' => $headers['content-type'] ?? 'application/octet-stream',
                    'content' => $body,
                ];
            } else {
                $fields[$fieldName] = $body;
            }
        }
        return [$fields, $files];
    }
}