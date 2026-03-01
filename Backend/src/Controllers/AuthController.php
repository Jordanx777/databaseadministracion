<?php

namespace App\Controllers;

use App\Models\UsuarioModel;
use App\Helpers\ResponseHelper;

class AuthController
{

    // POST /api/auth/register
    public function register(): void
    {
        header('Content-Type: application/json; charset=UTF-8');

        try {
            $rawInput = file_get_contents('php://input');
            $input    = json_decode($rawInput, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                ResponseHelper::error('JSON inválido: ' . json_last_error_msg(), 400);
                return;
            }

            // Validar campos requeridos
            $requiredFields = ['nombre', 'apellido', 'email', 'password', 'confirmPassword', 'telefono', 'id_rol'];
            foreach ($requiredFields as $field) {
                if (empty($input[$field]) || trim((string)$input[$field]) === '') {
                    ResponseHelper::error("El campo '$field' es requerido", 400);
                    return;
                }
            }

            // Validar email
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                ResponseHelper::error('El formato del correo electrónico es inválido', 400);
                return;
            }

            // Validar longitud de contraseña
            if (strlen($input['password']) < 6) {
                ResponseHelper::error('La contraseña debe tener al menos 6 caracteres', 400);
                return;
            }

            // Validar que las contraseñas coincidan
            if ($input['password'] !== $input['confirmPassword']) {
                ResponseHelper::error('Las contraseñas no coinciden', 400);
                return;
            }

            $usuarioModel = new UsuarioModel();

            // Verificar si el email ya existe
            if ($usuarioModel->existsByEmail($input['email'])) {
                ResponseHelper::error('El correo electrónico ya está registrado', 409);
                return;
            }

            // Hash de la contraseña
            $passwordHash = password_hash($input['password'], PASSWORD_BCRYPT);

            $userData = [
                'nombre'    => trim($input['nombre']),
                'apellido'  => trim($input['apellido']),
                'correo'    => trim($input['email']),
                'contrasena' => $passwordHash,
                'telefono'  => trim($input['telefono']),
                'direccion' => trim($input['direccion'] ?? ''),
                'id_rol'    => (int)$input['id_rol'],
                'activo'    => true,
            ];

            $userId = $usuarioModel->create($userData);

            if ($userId) {
                $user = $usuarioModel->getById($userId);
                unset($user['contrasena']);

                session_start();
                $_SESSION['user_id']    = $userId;
                $_SESSION['user_email'] = $user['correo'];
                $_SESSION['user_role']  = $user['id_rol'];

                ResponseHelper::created(
                    ['user' => $user],
                    'Usuario registrado exitosamente'
                );
            } else {
                throw new \Exception('No se pudo crear el usuario');
            }
        } catch (\PDOException $e) {
            ResponseHelper::error('Error de base de datos: ' . $e->getMessage(), 500);
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // POST /api/auth/login
    public function login(): void
    {
        header('Content-Type: application/json; charset=UTF-8');

        try {
            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['email']) || empty($input['password'])) {
                ResponseHelper::error('El correo y la contraseña son requeridos', 400);
                return;
            }

            $usuarioModel = new UsuarioModel();
            $user         = $usuarioModel->getByEmail($input['email']);

            if (!$user) {
                ResponseHelper::error('Credenciales inválidas', 401);
                return;
            }

            if (!password_verify($input['password'], $user['contrasena'])) {
                ResponseHelper::error('Credenciales inválidas', 401);
                return;
            }

            if (!$user['activo']) {
                ResponseHelper::error('Esta cuenta ha sido desactivada. Contacte al administrador', 403);
                return;
            }

            session_start();
            $_SESSION['user_id']    = $user['id_usuario'];
            $_SESSION['user_email'] = $user['correo'];
            $_SESSION['user_role']  = $user['id_rol'];

            $usuarioModel->updateLastAccess($user['id_usuario']);

            unset($user['contrasena']);

            ResponseHelper::success(
                ['user' => $user],
                'Bienvenido, ' . $user['nombre']
            );
        } catch (\Exception $e) {
            ResponseHelper::error('Error al iniciar sesión: ' . $e->getMessage(), 500);
        }
    }

    // POST /api/auth/logout
    public function logout(): void
    {
        header('Content-Type: application/json; charset=UTF-8');

        session_start();
        session_destroy();

        ResponseHelper::success(null, 'Sesión cerrada exitosamente');
    }

    // GET /api/auth/me
    public function me(): void
    {
        header('Content-Type: application/json; charset=UTF-8');

        session_start();

        if (!isset($_SESSION['user_id'])) {
            ResponseHelper::unauthorized('No hay una sesión activa');
            return;
        }

        try {
            $usuarioModel = new UsuarioModel();
            $user         = $usuarioModel->getById($_SESSION['user_id']);

            if (!$user) {
                ResponseHelper::notFound('Usuario no encontrado');
                return;
            }

            unset($user['contrasena']);
            ResponseHelper::success(['user' => $user], 'Datos del usuario obtenidos');
        } catch (\Exception $e) {
            ResponseHelper::error('Error al obtener el usuario: ' . $e->getMessage(), 500);
        }
    }
}
