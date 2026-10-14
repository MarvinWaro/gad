# PHLGADIS production image: Nginx and PHP-FPM in one container on port 8080.
# Coolify builds it on the VPS. The environment, the scheduler task and the
# storage volume it needs are in docs/deployment.md.


# ============================================================
# Node dependencies
# Cached apart from the app's source.
# ============================================================
FROM node:22-bookworm-slim AS node-dependencies

WORKDIR /var/www/html

COPY package.json package-lock.json .npmrc ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
    --no-audit \
    --no-fund


# ============================================================
# Composer dependencies and the app's source
#
# Debian, so the Node binary above runs here for the Vite build.
# Only PHP files leave this stage, so the final image stays Alpine.
# ============================================================
FROM serversideup/php:8.5-cli-bookworm AS php-dependencies

WORKDIR /var/www/html

USER www-data

# The manifests first, so vendor stays cached until they change.
COPY --chown=www-data:www-data composer.json composer.lock ./

RUN --mount=type=cache,target=/tmp/composer-cache,uid=33,gid=33 \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --no-autoloader

COPY --chown=www-data:www-data . .

# storage/ stays out of the build (.dockerignore), but Laravel needs its
# folders. The autoloader runs package discovery now that the app is here.
RUN mkdir -p \
    storage/app/private \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    && composer dump-autoload \
    --no-dev \
    --optimize \
    --classmap-authoritative \
    --no-interaction


# ============================================================
# Frontend build
#
# PHP and vendor are here because Wayfinder writes the typed
# routes through `php artisan` during the Vite build.
# ============================================================
FROM php-dependencies AS frontend

USER root

# Only the Node runtime, without overwriting anything else under /usr/local.
COPY --link --from=node-dependencies /usr/local/bin/node /usr/local/bin/node

COPY --link --from=node-dependencies \
    --chown=33:33 \
    /var/www/html/node_modules \
    /var/www/html/node_modules

USER www-data

# Baked into the bundle as the browser tab's title.
ARG VITE_APP_NAME=PHLGADIS

RUN node node_modules/vite-plus/bin/vp build


# ============================================================
# Runtime files
# Drops the build-only sources. Blade's @vite only reads
# public/build/manifest.json at runtime.
# ============================================================
FROM php-dependencies AS runtime-files

RUN rm -rf \
    docker \
    resources/css \
    resources/js \
    .npmrc \
    components.json \
    package.json \
    package-lock.json \
    pnpm-workspace.yaml \
    tsconfig.json \
    vite.config.ts


# ============================================================
# Production (the default target, so it stays the last stage)
# Alpine, with pdo_mysql, redis, zip, pcntl and opcache built in.
# ============================================================
FROM serversideup/php:8.5-fpm-nginx-alpine AS production

WORKDIR /var/www/html

# At each start: storage:link, then config, route, view and event caches.
# Migrations stay a manual `php artisan migrate --force`, so they are off.
# The health check asks Laravel's own /up, not only Nginx. Nginx's 8k
# FastCGI header buffer is too small for a full page's headers (cookies
# and preload links) and answers 502; both sizes must grow together.
ENV PHP_OPCACHE_ENABLE=1 \
    AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=false \
    HEALTHCHECK_PATH=/up \
    NGINX_FASTCGI_BUFFER_SIZE=32k \
    NGINX_FASTCGI_BUFFERS="16 32k"

# Nginx: .mjs goes out as JavaScript, and the built .mjs and .wasm files
# are cached like the rest of public/build.
COPY docker/nginx/mime-types.conf /etc/nginx/conf.d/mime-types.conf
COPY docker/nginx/build-assets.conf /etc/nginx/server-opts.d/build-assets.conf

# COPY --link cannot resolve user names; 82:82 is www-data on Alpine.
COPY --link --from=runtime-files \
    --chown=82:82 \
    /var/www/html \
    /var/www/html

COPY --link --from=frontend \
    --chown=82:82 \
    /var/www/html/public/build \
    /var/www/html/public/build

USER www-data

EXPOSE 8080
