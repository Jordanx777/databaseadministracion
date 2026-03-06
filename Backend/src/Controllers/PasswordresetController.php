<?php
namespace App\Controllers;

use App\Models\UsuarioModel;
use App\Models\PasswordResetModel;
use App\Helpers\ResponseHelper;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class PasswordResetController {

    private UsuarioModel       $usuarioModel;
    private PasswordResetModel $resetModel;

    // ✅ true  = devMode  → token visible en la respuesta (sin email)
    // ✅ false = producción → envía email real via SMTP
    private bool $devMode = false;

    public function __construct() {
        $this->usuarioModel = new UsuarioModel();
        $this->resetModel   = new PasswordResetModel();
    }

    // ── POST /api/auth/forgot-password ────────────────────
    public function forgotPassword(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['correo'])) {
                ResponseHelper::error('El correo es requerido', 400);
                return;
            }

            $usuario = $this->usuarioModel->getByEmail(trim($data['correo']));

            // Siempre el mismo mensaje aunque el correo no exista (seguridad)
            if (!$usuario || !$usuario['activo']) {
                ResponseHelper::success(null, 'Si el correo existe, recibirás un enlace en breve.');
                return;
            }

            $token    = $this->resetModel->createToken($usuario['id_usuario']);
            $resetUrl = ($_ENV['FRONTEND_URL'] ?? 'http://localhost:4200') . "/reset-password?token=$token";

            if ($this->devMode) {
                // ── MODO DEV: devuelve token en respuesta ─────
                ResponseHelper::success([
                    'debug' => [
                        'token'     => $token,
                        'reset_url' => $resetUrl,
                    ]
                ], '[DEV] Copia la reset_url en el navegador para probar el flujo.');
            } else {
                // ── PRODUCCIÓN: envía email real ──────────────
                $this->sendResetEmail($usuario['correo'], $usuario['nombre'], $resetUrl);
                ResponseHelper::success(null, 'Si el correo existe, recibirás un enlace en breve.');
            }

        } catch (\Exception $e) {
            ResponseHelper::error('Error al procesar la solicitud: ' . $e->getMessage(), 500);
        }
    }

    // ── POST /api/auth/reset-password ─────────────────────
    public function resetPassword(): void {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['token'])) {
                ResponseHelper::error('Token requerido', 400);
                return;
            }
            if (empty($data['password'])) {
                ResponseHelper::error('La contraseña es requerida', 400);
                return;
            }
            if (strlen($data['password']) < 6) {
                ResponseHelper::error('La contraseña debe tener al menos 6 caracteres', 400);
                return;
            }
            if ($data['password'] !== ($data['confirmPassword'] ?? '')) {
                ResponseHelper::error('Las contraseñas no coinciden', 400);
                return;
            }

            $idUsuario = $this->resetModel->validateToken($data['token']);
            if (!$idUsuario) {
                ResponseHelper::error('El enlace es inválido o ha expirado', 400);
                return;
            }

            $hash = password_hash($data['password'], PASSWORD_BCRYPT);
            $this->usuarioModel->updatePassword($idUsuario, $hash);
            $this->resetModel->markUsed($data['token']);

            ResponseHelper::success(null, 'Contraseña actualizada exitosamente');

        } catch (\Exception $e) {
            ResponseHelper::error('Error al resetear la contraseña: ' . $e->getMessage(), 500);
        }
    }

    // ── GET /api/auth/validate-token?token=... ────────────
    public function validateToken(): void {
        try {
            $token = $_GET['token'] ?? '';

            if (empty($token)) {
                ResponseHelper::error('Token requerido', 400);
                return;
            }

            $idUsuario = $this->resetModel->validateToken($token);

            if ($idUsuario) {
                ResponseHelper::success(['valid' => true], 'Token válido');
            } else {
                ResponseHelper::error('El enlace es inválido o ha expirado', 400);
            }
        } catch (\Exception $e) {
            ResponseHelper::error($e->getMessage(), 500);
        }
    }

    // ── Envío de email via SMTP (.env) ────────────────────
    private function sendResetEmail(string $correo, string $nombre, string $resetUrl): void {
        $mail = new PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = $_ENV['MAIL_HOST'];       // sandbox.smtp.mailtrap.io
        $mail->SMTPAuth   = true;
        $mail->Username   = $_ENV['MAIL_USERNAME'];   // 3c7a8cbebab444
        $mail->Password   = $_ENV['MAIL_PASSWORD'];   // tu password de mailtrap
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = (int) ($_ENV['MAIL_PORT'] ?? 2525);
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(
            $_ENV['MAIL_FROM']      ?? 'noreply@tuapp.com',
            $_ENV['MAIL_FROM_NAME'] ?? 'Tu App'
        );
        $mail->addAddress($correo, $nombre);

        $mail->isHTML(true);
        $mail->Subject = 'Recuperación de contraseña';
        $mail->Body    = $this->buildEmailTemplate($nombre, $resetUrl);
        $mail->AltBody = "Hola $nombre, usa este enlace para recuperar tu contraseña (válido 1 hora): $resetUrl";

        $mail->send();
    }

    // ── Template HTML del email ───────────────────────────
    private function buildEmailTemplate(string $nombre, string $resetUrl): string {
        return <<<HTML
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f5f6fa;font-family:Inter,system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:48px 24px;">
              <table width="540" cellpadding="0" cellspacing="0"
                style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                <tr>
                  <td style="background:#0ea5e9;padding:32px 40px;">
                    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">
                      Recuperar contraseña
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
                      Hola <strong>$nombre</strong>,
                    </p>
                    <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
                      Recibimos una solicitud para restablecer tu contraseña.
                      Este enlace es válido por <strong>1 hora</strong>.
                    </p>
                    <a href="$resetUrl"
                      style="display:inline-block;background:#0ea5e9;color:#fff;
                             text-decoration:none;padding:14px 32px;border-radius:10px;
                             font-size:14px;font-weight:700;">
                      Restablecer contraseña
                    </a>
                    <p style="margin:28px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                      Si no solicitaste este cambio, ignora este correo.<br>
                      <a href="$resetUrl" style="color:#0ea5e9;word-break:break-all;">$resetUrl</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                             padding:20px 40px;text-align:center;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      Este es un correo automático, no respondas.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        HTML;
    }
}