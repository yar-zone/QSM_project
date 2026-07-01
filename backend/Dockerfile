FROM php:8.2-cli-alpine

RUN apk add --no-cache \
    bash \
    curl \
    git \
    oniguruma-dev \
    libzip-dev \
    libpng-dev \
    libxml2-dev \
    icu-dev \
    sqlite-dev \
    postgresql-dev \
    linux-headers \
  && docker-php-ext-install -j$(nproc) \
    bcmath \
    calendar \
    ctype \
    fileinfo \
    gd \
    intl \
    mbstring \
    pcntl \
    pdo \
    pdo_mysql \
    pdo_sqlite \
    pdo_pgsql \
    xml \
    zip \
  && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for better caching
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-autoloader --prefer-dist --no-dev

# Copy the rest of the application
COPY . .

# Create .env from docker-specific config
COPY .env.docker .env

# Final composer install with all dependencies and optimize
RUN composer install --no-interaction --prefer-dist --no-dev \
  && composer dump-autoload --optimize \
  && rm -rf bootstrap/cache/*.php

# Set up storage permissions
RUN mkdir -p storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
  && chmod -R 775 storage bootstrap/cache database \
  && chown -R www-data:www-data storage bootstrap/cache database

# Copy and set up entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
