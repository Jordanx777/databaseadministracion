<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class UsuarioModel {

    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    // ── Listar con paginación y filtros ───────────────────
    public function getAll(int $page = 1, int $perPage = 10, array $filters = []): array {
        try {
            $offset = ($page - 1) * $perPage;
            $where  = ['1=1'];
            $params = [];

            if (!empty($filters['search'])) {
                $where[]          = "(u.nombre ILIKE :search OR u.apellido ILIKE :search OR u.correo ILIKE :search)";
                $params['search'] = '%' . $filters['search'] . '%';
            }
            if (isset($filters['activo']) && $filters['activo'] !== '') {
                $where[]          = "u.activo = :activo";
                // No agregamos al $params general — lo bindeamos manualmente más abajo con PARAM_BOOL
                $activoVal = filter_var($filters['activo'], FILTER_VALIDATE_BOOLEAN);
            }
            if (!empty($filters['id_rol'])) {
                $where[]         = "u.id_rol = :id_rol";
                $params['id_rol'] = (int) $filters['id_rol'];
            }

            $whereStr = implode(' AND ', $where);

            // Total de registros
            $countSql  = "SELECT COUNT(*) AS total FROM usuario u WHERE $whereStr";
            $countStmt = $this->db->prepare($countSql);
            // Bindear params del count — activo con PARAM_BOOL explícito
            foreach ($params as $key => $val) {
                $countStmt->bindValue(":$key", $val, PDO::PARAM_STR);
            }
            if (isset($activoVal)) {
                $countStmt->bindValue(':activo', $activoVal, PDO::PARAM_BOOL);
            }
            $countStmt->execute();
            $total = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Datos paginados
            $sql = "SELECT u.id_usuario, u.nombre, u.apellido, u.correo,
                           u.telefono, u.direccion, u.id_rol, r.nombre AS rol_nombre,
                           u.activo, u.ultimo_acceso, u.fecha_creacion, u.fecha_actualizacion
                    FROM usuario u
                    LEFT JOIN rol r ON u.id_rol = r.id_rol
                    WHERE $whereStr
                    ORDER BY u.id_usuario
                    LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);
            // Bindear el resto de params como string
            foreach ($params as $key => $val) {
                $stmt->bindValue(":$key", $val, PDO::PARAM_STR);
            }
            // Bindear activo como boolean explícito
            if (isset($activoVal)) {
                $stmt->bindValue(':activo', $activoVal, PDO::PARAM_BOOL);
            }
            $stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
            $stmt->execute();

            return [
                'data'       => $stmt->fetchAll(PDO::FETCH_ASSOC),
                'total'      => $total,
                'page'       => $page,
                'per_page'   => $perPage,
                'last_page'  => (int) ceil($total / $perPage),
            ];
        } catch (\PDOException $e) {
            throw new \Exception("Error al listar usuarios: " . $e->getMessage());
        }
    }

     // ── Actualizar contraseña ─────────────────────────────
    public function updatePassword(int $id, string $passwordHash): bool {
        try {
            $stmt = $this->db->prepare("
                UPDATE usuario
                SET contrasena = :contrasena, fecha_actualizacion = NOW()
                WHERE id_usuario = :id
            ");
            return $stmt->execute(['contrasena' => $passwordHash, 'id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar contraseña: " . $e->getMessage());
        }
    }

    // ── Obtener por ID ────────────────────────────────────
    public function getById(int $id): ?array {
        try {
            $stmt = $this->db->prepare("
                SELECT u.*, r.nombre AS rol_nombre
                FROM usuario u
                LEFT JOIN rol r ON u.id_rol = r.id_rol
                WHERE u.id_usuario = :id
            ");
            $stmt->execute(['id' => $id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al obtener usuario: " . $e->getMessage());
        }
    }

    // ── Obtener por email ─────────────────────────────────
    public function getByEmail(string $email): ?array {
        try {
            $stmt = $this->db->prepare("
                SELECT u.*, r.nombre AS rol_nombre
                FROM usuario u
                LEFT JOIN rol r ON u.id_rol = r.id_rol
                WHERE u.correo = :email
            ");
            $stmt->execute(['email' => $email]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al obtener usuario: " . $e->getMessage());
        }
    }

    // ── Verificar email existente ─────────────────────────
    public function existsByEmail(string $email, ?int $excludeId = null): bool {
        try {
            if ($excludeId) {
                $stmt = $this->db->prepare("SELECT COUNT(*) AS count FROM usuario WHERE correo = :email AND id_usuario != :id");
                $stmt->execute(['email' => $email, 'id' => $excludeId]);
            } else {
                $stmt = $this->db->prepare("SELECT COUNT(*) AS count FROM usuario WHERE correo = :email");
                $stmt->execute(['email' => $email]);
            }
            return (int) $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
        } catch (\PDOException $e) {
            throw new \Exception("Error al verificar email: " . $e->getMessage());
        }
    }

    // ── Crear usuario ─────────────────────────────────────
    public function create(array $data): ?int {
        try {
            $sql = "INSERT INTO usuario
                        (nombre, apellido, correo, contrasena, telefono, direccion, id_rol, activo, fecha_creacion)
                    VALUES
                        (:nombre, :apellido, :correo, :contrasena, :telefono, :direccion, :id_rol, :activo, CURRENT_TIMESTAMP)
                    RETURNING id_usuario";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'nombre'     => $data['nombre'],
                'apellido'   => $data['apellido']  ?? null,
                'correo'     => $data['correo'],
                'contrasena' => $data['contrasena'],
                'telefono'   => $data['telefono']  ?? null,
                'direccion'  => $data['direccion'] ?? null,
                'id_rol'     => (int) $data['id_rol'],
                'activo'     => $data['activo']    ?? true,
            ]);

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result['id_usuario'] ?? null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear usuario: " . $e->getMessage());
        }
    }

    // ── Actualizar usuario ────────────────────────────────
    public function update(int $id, array $data): bool {
        try {
            if (!$this->getById($id)) {
                throw new \Exception("Usuario no encontrado.");
            }

            $fields  = [];
            $allowed = ['nombre', 'apellido', 'correo', 'telefono', 'direccion', 'id_rol'];

            foreach ($allowed as $field) {
                if (isset($data[$field])) $fields[] = "$field = :$field";
            }
            if (array_key_exists('activo', $data)) $fields[] = "activo = :activo";
            if (empty($fields)) throw new \Exception("No se proporcionaron campos.");

            $fields[] = "fecha_actualizacion = NOW()";
            $sql      = "UPDATE usuario SET " . implode(", ", $fields) . " WHERE id_usuario = :id";
            $stmt     = $this->db->prepare($sql);

            $params = ['id' => $id];
            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $params[$field] = $field === 'id_rol' ? (int) $data[$field] : $data[$field];
                }
            }
            if (array_key_exists('activo', $data)) {
                $activo = $data['activo'];
                $params['activo'] = ($activo === '' || $activo === null)
                    ? false
                    : (is_string($activo) ? filter_var($activo, FILTER_VALIDATE_BOOLEAN) : (bool) $activo);
            }

            return $stmt->execute($params);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar usuario: " . $e->getMessage());
        }
    }

    // ── Cambiar rol ───────────────────────────────────────
    public function changeRol(int $id, int $idRol): bool {
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET id_rol = :id_rol, fecha_actualizacion = NOW() WHERE id_usuario = :id");
            return $stmt->execute(['id_rol' => $idRol, 'id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al cambiar rol: " . $e->getMessage());
        }
    }

    // ── Cambiar estado activo ─────────────────────────────
    public function toggleActivo(int $id, bool $activo): bool {
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET activo = :activo, fecha_actualizacion = NOW() WHERE id_usuario = :id");
            $stmt->bindValue(':activo', $activo, PDO::PARAM_BOOL);
            $stmt->bindValue(':id',     $id,     PDO::PARAM_INT);
            return $stmt->execute();
        } catch (\PDOException $e) {
            throw new \Exception("Error al cambiar estado: " . $e->getMessage());
        }
    }

    // ── Soft delete ───────────────────────────────────────
    public function delete(int $id): bool {
        try {
            if (!$this->getById($id)) throw new \Exception("Usuario no encontrado.");
            $stmt = $this->db->prepare("UPDATE usuario SET activo = false, fecha_actualizacion = NOW() WHERE id_usuario = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al eliminar usuario: " . $e->getMessage());
        }
    }

    // ── Actualizar último acceso ──────────────────────────
    public function updateLastAccess(int $id): bool {
        try {
            $stmt = $this->db->prepare("UPDATE usuario SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id_usuario = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al actualizar último acceso: " . $e->getMessage());
        }
    }
}