<?php
namespace App\Controllers;

use App\Models\UsuarioModel;


class AuthController {
    
    // POST /api/auth/register
    public function register(): void {
        // ✅ Asegurar que siempre retorne JSON
        header('Content-Type: application/json; charset=UTF-8');
        
        try {
            error_log("=== INICIO REGISTRO ===");
            
            // Obtener datos del JSON
            $rawInput = file_get_contents('php://input');
            error_log("Raw input: " . $rawInput);
            
            $input = json_decode($rawInput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'JSON inválido: ' . json_last_error_msg()
                ]);
                return;
            }
            
            error_log("Input decodificado: " . json_encode($input));
            
            // Validar datos requeridos
            $requiredFields = ['nombre', 'apellido', 'email', 'password', 'confirmPassword', 'telefono', 'id_rol'];
            
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || trim($input[$field]) === '') {
                    http_response_code(400);
                    echo json_encode([
                        'status' => 'error',
                        'message' => "El campo $field es requerido"
                    ]);
                    return;
                }
            }
            
            // Validar formato de email
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Email inválido'
                ]);
                return;
            }
            
            // Validar longitud de contraseña
            if (strlen($input['password']) < 6) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'La contraseña debe tener al menos 6 caracteres'
                ]);
                return;
            }

            // Comparar las contraseñas
            if ($input['password'] !== $input['confirmPassword']) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Las contraseñas no coinciden'
                ]);
                return;
            }
            
            error_log("Validaciones pasadas, creando modelo...");
            
            $usuarioModel = new UsuarioModel();
            
            error_log("Modelo creado, verificando email...");
            
            // Verificar si el email ya existe
            if ($usuarioModel->existsByEmail($input['email'])) {
                http_response_code(409);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'El correo electrónico ya está registrado'
                ]);
                return;
            }
            
            error_log("Email disponible, hasheando contraseña...");
            
            // Hash de la contraseña
            $passwordHash = password_hash($input['password'], PASSWORD_BCRYPT);
            
            // Preparar datos
            $userData = [
                'nombre' => trim($input['nombre']),
                'apellido' => trim($input['apellido']),
                'correo' => trim($input['email']),
                'contrasena' => $passwordHash,
                'telefono' => trim($input['telefono']),
                'id_rol' => (int)$input['id_rol'],
                'activo' => true,
                
            ];
            
            error_log("Datos preparados: " . json_encode($userData));
            error_log("Creando usuario en BD...");
            
            // Crear usuario
            $userId = $usuarioModel->create($userData);
            
            error_log("Usuario creado con ID: $userId");
            
            if ($userId) {
                // Obtener usuario completo (sin contraseña)
                $user = $usuarioModel->getById($userId);
                
                // Iniciar sesión
                session_start();
                $_SESSION['user_id'] = $userId;
                $_SESSION['user_email'] = $user['correo'];
                $_SESSION['user_role'] = $user['id_rol'];
                
                error_log("Sesión iniciada, retornando respuesta...");
                
                http_response_code(201);
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Usuario registrado exitosamente',
                    'data' => [
                        'user' => $user
                    ]
                ]);
            } else {
                throw new \Exception('Error al crear el usuario - ID null');
            }
            
        } catch (\PDOException $e) {
            error_log("❌ PDO Exception: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Error de base de datos',
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            error_log("❌ Exception: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Error al registrar usuario',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    // POST /api/auth/login
    public function login(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['email']) || empty($input['password'])) {
                http_response_code(400);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Email y contraseña son requeridos'
                ]);
                return;
            }
            
            $usuarioModel = new UsuarioModel();
            $user = $usuarioModel->getByEmail($input['email']);
            
            if (!$user) {
                http_response_code(401);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Credenciales inválidas'
                ]);
                return;
            }
            
            // Verificar contraseña
            if (!password_verify($input['password'], $user['contrasena'])) {
                http_response_code(401);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Credenciales inválidas'
                ]);
                return;
            }
            
            // Verificar si está activo
            if (!$user['activo']) {
                http_response_code(403);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Usuario desactivado'
                ]);
                return;
            }
            
            // Iniciar sesión
            session_start();
            $_SESSION['user_id'] = $user['id_usuario'];
            $_SESSION['user_email'] = $user['correo'];
            $_SESSION['user_role'] = $user['id_rol'];
            
            // Actualizar último acceso
            // $usuarioModel->updateLastAccess($user['id_usuario']);
            
            // Quitar contraseña antes de enviar
            unset($user['contrasena']);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Login exitoso',
                'data' => [
                    'user' => $user
                ]
            ]);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Error al iniciar sesión',
                'error' => $e->getMessage()
            ]);
        }
    }
    
    // POST /api/auth/logout
    public function logout(): void {
        session_start();
        session_destroy();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Sesión cerrada'
        ]);
    }
    
    // GET /api/auth/me
    public function me(): void {
        session_start();
        
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode([
                'status' => 'error',
                'message' => 'No autenticado'
            ]);
            return;
        }
        
        try {
            $usuarioModel = new UsuarioModel();
            $user = $usuarioModel->getById($_SESSION['user_id']);
            
            if ($user) {
                unset($user['contrasena']);
                echo json_encode([
                    'status' => 'success',
                    'data' => [
                        'user' => $user
                    ]
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'status' => 'error',
                    'message' => 'Usuario no encontrado'
                ]);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Error al obtener usuario',
                'error' => $e->getMessage()
            ]);
        }
    }
}