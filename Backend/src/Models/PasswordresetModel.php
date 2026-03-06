<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class PasswordResetModel {

    private PDO $db;

    public function __construct() {
        $this->db = Database::connect();
    }

    // Crear token para un usuario (invalida los anteriores)
    public function createToken(int $idUsuario): string {
        try {
            // Invalida tokens anteriores del mismo usuario
            $this->db->prepare("DELETE FROM password_reset WHERE id_usuario = :id")
                     ->execute(['id' => $idUsuario]);

            $token = bin2hex(random_bytes(32)); // 64 chars hex seguro

            $stmt = $this->db->prepare("
                INSERT INTO password_reset (id_usuario, token, expira_en)
                VALUES (:id_usuario, :token, NOW() + INTERVAL '1 hour')
            ");
            $stmt->execute([
                'id_usuario' => $idUsuario,
                'token'      => $token,
            ]);

            return $token;
        } catch (\PDOException $e) {
            throw new \Exception("Error al crear token: " . $e->getMessage());
        }
    }

    // Validar token — devuelve el id_usuario si es válido, null si no
    public function validateToken(string $token): ?int {
        try {
            $stmt = $this->db->prepare("
                SELECT id_usuario
                FROM password_reset
                WHERE token    = :token
                  AND usado    = false
                  AND expira_en > NOW()
            ");
            $stmt->execute(['token' => $token]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? (int) $result['id_usuario'] : null;
        } catch (\PDOException $e) {
            throw new \Exception("Error al validar token: " . $e->getMessage());
        }
    }

    // Marcar token como usado después de resetear
    public function markUsed(string $token): void {
        try {
            $this->db->prepare("UPDATE password_reset SET usado = true WHERE token = :token")
                     ->execute(['token' => $token]);
        } catch (\PDOException $e) {
            throw new \Exception("Error al marcar token: " . $e->getMessage());
        }
    }
}