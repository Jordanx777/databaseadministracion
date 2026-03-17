<?php
namespace App\Controllers;

use App\Models\UsuarioModel;
use App\Helpers\ResponseHelper;

class UsuariosController {

    private UsuarioModel $usuarioModel;

    public function __construct() {
        $this->usuarioModel = new UsuarioModel();
    }

    // ── GET /api/usuarios?page=1&per_page=10&search=&activo=&id_rol= ──
    public function getAll(): void {
        try {
            $page    = (int)  ($_GET['page']     ?? 1);
            $perPage = (int)  ($_GET['per_page'] ?? 10);
            $filters = [
                'search' => $_GET['search'] ?? '',
                'activo' => $_GET['activo'] ?? '',
                'id_rol' => $_GET['id_rol'] ?? '',
            ];

            $result = $this->usuarioModel->getAll($page, $perPage, $filters);
            ResponseHelper::success($result, 'Usuarios obtenidos exitosamente');
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ── GET /api/usuarios/{id} ────────────────────────────
    public function getById(array $params): void {
        try {
            $id      = (int) ($params['id'] ?? 0);
            $usuario = $this->usuarioModel->getById($id);

            if ($usuario) {
                unset($usuario['contrasena']);
                ResponseHelper::success($usuario, 'Usuario obtenido exitosamente');
            } else {
                ResponseHelper::notFound('Usuario no encontrado');
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ── POST /api/usuarios ────────────────────────────────
    public function create(): void {
        try {
            $data     = json_decode(file_get_contents('php://input'), true);
            $required = ['nombre', 'correo', 'password', 'id_rol'];

            foreach ($required as $field) {
                if (empty($data[$field])) {
                    ResponseHelper::error("El campo '$field' es requerido", 400);
                    return;
                }
            }

            if (!filter_var($data['correo'], FILTER_VALIDATE_EMAIL)) {
                ResponseHelper::error('El correo electrónico no es válido', 400);
                return;
            }
            if (strlen($data['password']) < 6) {
                ResponseHelper::error('La contraseña debe tener al menos 6 caracteres', 400);
                return;
            }
            if ($this->usuarioModel->existsByEmail($data['correo'])) {
                ResponseHelper::error('El correo ya está registrado', 409);
                return;
            }

            $userData = [
                'nombre'     => trim($data['nombre']),
                'apellido'   => trim($data['apellido']  ?? ''),
                'correo'     => trim($data['correo']),
                'contrasena' => password_hash($data['password'], PASSWORD_BCRYPT),
                'telefono'   => trim($data['telefono']  ?? ''),
                'direccion'  => trim($data['direccion'] ?? ''),
                'id_rol'     => (int) $data['id_rol'],
                'activo'     => $data['activo'] ?? true,
            ];

            $id = $this->usuarioModel->create($userData);
            if ($id) {
                ResponseHelper::created(['id_usuario' => $id], 'Usuario creado exitosamente');
            } else {
                ResponseHelper::error('No se pudo crear el usuario', 500);
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ── PUT /api/usuarios/{id} ────────────────────────────
    public function update(array $params): void {
        try {
            $id   = (int) ($params['id'] ?? 0);
            $data = json_decode(file_get_contents('php://input'), true);

            if (!empty($data['correo'])) {
                if (!filter_var($data['correo'], FILTER_VALIDATE_EMAIL)) {
                    ResponseHelper::error('El correo electrónico no es válido', 400);
                    return;
                }
                if ($this->usuarioModel->existsByEmail($data['correo'], $id)) {
                    ResponseHelper::error('El correo ya está en uso', 409);
                    return;
                }
            }

            $result = $this->usuarioModel->update($id, $data);
            if ($result) {
                ResponseHelper::success(['id_usuario' => $id], 'Usuario actualizado exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar el usuario', 500);
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ── PATCH /api/usuarios/{id}/rol ──────────────────────
    public function changeRol(array $params): void {
        try {
            $id   = (int) ($params['id'] ?? 0);
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['id_rol'])) {
                ResponseHelper::error('El campo id_rol es requerido', 400);
                return;
            }

            $result = $this->usuarioModel->changeRol($id, (int) $data['id_rol']);
            if ($result) {
                ResponseHelper::success(['id_usuario' => $id], 'Rol actualizado exitosamente');
            } else {
                ResponseHelper::error('No se pudo actualizar el rol', 500);
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ── PATCH /api/usuarios/{id}/toggle ───────────────────
    public function toggleActivo(array $params): void {
        try {
            $id   = (int) ($params['id'] ?? 0);
            $data = json_decode(file_get_contents('php://input'), true);

            if (!array_key_exists('activo', $data)) {
                ResponseHelper::error('El campo activo es requerido', 400);
                return;
            }

            $activo = filter_var($data['activo'], FILTER_VALIDATE_BOOLEAN);
            $result = $this->usuarioModel->toggleActivo($id, $activo);

            if ($result) {
                $msg = $activo ? 'Usuario activado exitosamente' : 'Usuario desactivado exitosamente';
                ResponseHelper::success(['id_usuario' => $id, 'activo' => $activo], $msg);
            } else {
                ResponseHelper::error('No se pudo cambiar el estado', 500);
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ── DELETE /api/usuarios/{id} ─────────────────────────
    public function delete(array $params): void {
        try {
            $id     = (int) ($params['id'] ?? 0);
            $result = $this->usuarioModel->delete($id);

            if ($result) {
                ResponseHelper::success(['id_usuario' => $id], 'Usuario eliminado exitosamente');
            } else {
                ResponseHelper::error('No se pudo eliminar el usuario', 500);
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    
    // ── POST /api/auth/change-password ───────────────────
    // Body: { password_actual, password_nuevo, confirmar_password }
    // Requiere sesión activa
    public function changePassword(): void {
        try {
            session_start();

            if (!isset($_SESSION['user_id'])) {
                http_response_code(401);
                echo json_encode(['status' => 'error', 'message' => 'No autenticado']);
                return;
            }

            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['password_actual'])) {
                ResponseHelper::error('La contraseña actual es requerida', 400);
                return;
            }
            if (empty($data['password_nuevo'])) {
                ResponseHelper::error('La nueva contraseña es requerida', 400);
                return;
            }
            if (strlen($data['password_nuevo']) < 6) {
                ResponseHelper::error('La nueva contraseña debe tener al menos 6 caracteres', 400);
                return;
            }
            if ($data['password_nuevo'] !== ($data['confirmar_password'] ?? '')) {
                ResponseHelper::error('Las contraseñas no coinciden', 400);
                return;
            }
            if ($data['password_actual'] === $data['password_nuevo']) {
                ResponseHelper::error('La nueva contraseña debe ser diferente a la actual', 400);
                return;
            }

            $usuarioModel = new UsuarioModel();
            $usuario      = $usuarioModel->getById($_SESSION['user_id']);

            if (!$usuario) {
                ResponseHelper::notFound('Usuario no encontrado');
                return;
            }

            // ✅ Verificar que la contraseña actual sea correcta
            if (!password_verify($data['password_actual'], $usuario['contrasena'])) {
                ResponseHelper::error('La contraseña actual es incorrecta', 401);
                return;
            }

            $hash = password_hash($data['password_nuevo'], PASSWORD_BCRYPT);
            $usuarioModel->updatePassword($_SESSION['user_id'], $hash);

            ResponseHelper::success(null, 'Contraseña actualizada exitosamente');

        } catch (\Exception $e) {
            ResponseHelper::error('Error al cambiar contraseña: ' . $e->getMessage(), 500);
        }
    }
}