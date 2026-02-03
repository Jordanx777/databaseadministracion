FROM php:8.2-apache

# Instalar extensiones PostgreSQL y herramientas
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar Apache
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf
RUN a2enmod rewrite headers

# Habilitar CORS para Angular
RUN echo '<IfModule mod_headers.c>' >> /etc/apache2/apache2.conf && \
    echo '    Header set Access-Control-Allow-Origin "http://localhost:4200"' >> /etc/apache2/apache2.conf && \
    echo '    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"' >> /etc/apache2/apache2.conf && \
    echo '    Header set Access-Control-Allow-Headers "Content-Type, Authorization"' >> /etc/apache2/apache2.conf && \
    echo '</IfModule>' >> /etc/apache2/apache2.conf

# Configurar DocumentRoot para apuntar a /var/www/html/public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

COPY . /var/www/html

RUN chown -R www-data:www-data /var/www/html

WORKDIR /var/www/html

# Instalar dependencias de Composer automáticamente
RUN composer install --no-dev --optimize-autoloader || true