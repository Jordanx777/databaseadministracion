<?php
namespace App\Config;

use PDO;
use PDOException;

class Database {
    // 1️⃣ Variable estática que guarda UNA SOLA conexión (patrón Singleton)
    private static ?PDO $instance = null;
    
    public static function connect(): PDO {
        // 2️⃣ Si no hay conexión, créala
        if (self::$instance === null) {
            try {
                // 3️⃣ Lee las variables de entorno
                $host = $_ENV['DB_HOST'];       // postgres
                $port = $_ENV['DB_PORT'];       // 5432
                $dbname = $_ENV['DB_NAME'];     // app_db
                $user = $_ENV['DB_USER'];       // app_user
                $password = $_ENV['DB_PASSWORD']; // secret
                
                // 4️⃣ Crea el string de conexión para PostgreSQL
                $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
                
                // 5️⃣ Crea la conexión PDO con opciones de seguridad
                self::$instance = new PDO($dsn, $user, $password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,  // Lanza excepciones en errores
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Retorna arrays asociativos
                    PDO::ATTR_EMULATE_PREPARES => false, // Usa prepared statements reales
                ]);

                
            } catch (PDOException $e) {
                throw new \Exception("Error de conexión: " . $e->getMessage());
            }
        }
        
        // 6️⃣ Retorna la conexión (siempre la misma instancia)
        return self::$instance;
    }
}
?>