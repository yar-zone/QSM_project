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
    pdo_sqlite \
    xml \
    zip \
  && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-autoloader --prefer-dist --no-dev

COPY . .

RUN composer install --no-interaction --prefer-dist --no-dev \
  && composer dump-autoload --optimize \
  && rm -rf bootstrap/cache/*.php

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
