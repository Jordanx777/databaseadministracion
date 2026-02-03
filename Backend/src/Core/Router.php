<?php
namespace App\Core;

class Router {
    private array $routes = [];

    public function get(string $path, callable|array $handler): void {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): void {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): void {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): void {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable|array $handler): void {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $path);
        $pattern = '#^' . $pattern . '$#';

        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function run(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        foreach ($this->routes as $route) {
            
            if ($route['method'] === $method && preg_match($route['pattern'], $uri, $matches)) {
                
                // Filtrar solo los parámetros nombrados
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                if (is_array($route['handler'])) {
                    [$controllerClass, $methodName] = $route['handler'];
                    
                    
                    // ✅ CORRECCIÓN: Verificar que la clase existe
                    if (!class_exists($controllerClass)) {
                        http_response_code(500);
                        echo json_encode([
                            'status' => 'error',
                            'message' => 'Controller class not found'
                        ]);
                        return;
                    }
                    
                    $controllerInstance = new $controllerClass();
                    
                    // ✅ CORRECCIÓN: Si no hay parámetros, llamar sin argumentos
                    if (empty($params)) {
                        $controllerInstance->$methodName();
                    } else {
                        $controllerInstance->$methodName($params);
                    }
                } else {
                    // Función anónima
                    call_user_func($route['handler'], $params);
                }
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Ruta no encontrada']);
    }
}