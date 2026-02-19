<?php

namespace App\Controllers;

use App\Models\ClientesModel;

use Exception;
use App\Helpers\ResponseHelper;

class ClientesController
{
    private $model;

    public function __construct()
    {
        $this->model = new ClientesModel();
    }

    // Métodos para manejar las solicitudes HTTP (GET, POST, PUT, DELETE)
    // Ejemplo:
    public function getAllClientes()
    {
        $clientes = $this->model->getAll();
        echo json_encode($clientes);
    }

    public function createCliente()
    {
        try {
            // como estoy enviando los datos asi this.svc.create(this.form); debo leer el body de la solicitud
            $input = json_decode(file_get_contents('php://input'), true);

            $nombre = $input['nombre'] ?? null;
            $apodo = $input['apodo'] ?? null;
            $telefono = $input['telefono'] ?? null;
            $direccion = $input['direccion'] ?? null;
            $referencias = $input['referencia'] ?? null;
            $limite_credito = $input['limite_credito'] ?? null;
            $tipo = $input['tipo'] ?? null;
            // valido que los campos requeridos estén presentes
            if (!$nombre || !$telefono || !$direccion || !$tipo) {
                http_response_code(400);
                echo json_encode(['error' => 'Los campos nombre, teléfono, dirección y tipo son requeridos']);
                return;
            }

            // limite de credito en positivo 
            if ($limite_credito !== null && $limite_credito < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'El límite de crédito debe ser un número positivo']);
                return;
            }
            $resultado = $this->model->create($nombre, $apodo, $telefono, $direccion, $referencias, $limite_credito, $tipo);
            if ($resultado) {
                http_response_code(201);
                echo json_encode(['message' => 'Cliente creado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear el cliente']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor', 'details' => $e->getMessage()]);
        }
    }

    public function getClienteById(array $params)
    {
        // Implementar lógica para obtener un cliente por ID
    }

    public function searchClientes(array $params = [])
{
    try {
        // ✅ Los parámetros GET vienen en $_GET, no en $params
        $query = $_GET['query'] ?? '';
        
        // Si no hay búsqueda, devolver todos los clientes
        if (empty(trim($query))) {
            return $this->getAllClientes();
        }
        
        $clientes = $this->model->searchByName($query);
        
        ResponseHelper::success($clientes, 'Clientes encontrados');
    } catch (Exception $e) {
        ResponseHelper::error('Error al buscar clientes: ' . $e->getMessage(), 500);
    }
}

    public function updateCliente(array $params)
    {
       try {
            $id = $params['id'] ?? null;
            $datos = json_decode(file_get_contents('php://input'), true);
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del cliente no proporcionado']);
                return;
            }

            $nombre = $datos['nombre'] ?? null;
            $apodo = $datos['apodo'] ?? null;
            $telefono = $datos['telefono'] ?? null;
            $direccion = $datos['direccion'] ?? null;
            $referencias = $datos['referencia'] ?? null;
            $limite_credito = $datos['limite_credito'] ?? null;
            $tipo = $datos['tipo'] ?? null;
            $fecha_actualizacion = $datos['updated_at'] ?? null;

            // como es un update valido que los campos requeridos estén presentes
            if (!$nombre || !$telefono || !$direccion || !$tipo) {
                http_response_code(400);
                echo json_encode(['error' => 'Los campos nombre, teléfono, dirección y tipo son requeridos']);
                return;
            }

            // verfico que el limite de credito sea mayor a 0
            if ($limite_credito !== null && $limite_credito < 0) {
                http_response_code(400);
                echo json_encode(['error' => 'El límite de crédito debe ser un número positivo']);
                return;
            }
            $resultado = $this->model->update($id, $nombre, $apodo, $telefono, $direccion, $referencias, $limite_credito, $tipo, $fecha_actualizacion);
            if ($resultado) {
                http_response_code(200);
                echo json_encode(['message' => 'Cliente actualizado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar el cliente']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor', 'details' => $e->getMessage()]);
        }
    }

    public function deleteCliente(array $params){
        try {
            $id = $params['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del cliente no proporcionado']);
                return;
            }
            $resultado = $this->model->delete($id);
            if ($resultado) {
                http_response_code(200);
                echo json_encode(['message' => 'Cliente eliminado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar el cliente']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error interno del servidor', 'details' => $e->getMessage()]);
        }
    }
}
