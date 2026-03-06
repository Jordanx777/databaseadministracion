<?

use App\Controllers\PasswordResetController;

$router->post('/api/auth/forgot-password', [PasswordResetController::class ,'forgotPassword']);
// GET simple — el ?token=... llega por $_GET['token'] automáticamente
$router->get('/api/auth/validate-token', [PasswordResetController::class, 'validateToken']);

$router->post('/api/auth/reset-password', [PasswordResetController::class ,'resetPassword']);

?>