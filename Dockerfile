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
# Composer dependencies
#
# Debian, so the Node binary above runs here for the Vite build.
# Only PHP files leave these stages, so the final image stays Alpine.
# Cached apart from the app's source, so the image's vendor layer
# only changes with composer.json or composer.lock.
# ============================================================
FROM serversideup/php:8.5-cli-bookworm AS composer-dependencies

WORKDIR /var/www/html

USER www-data

COPY --chown=www-data:www-data composer.json composer.lock ./

# pre-autoload-dump drops every AWS service but the ones composer.json
# lists (S3, for Spaces): about 70 MB of the SDK.
RUN --mount=type=cache,target=/tmp/composer-cache,uid=33,gid=33 \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --no-scripts \
    --no-autoloader \
    && composer run-script pre-autoload-dump


# ============================================================
# The app's source
# ============================================================
FROM composer-dependencies AS app

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
FROM app AS frontend

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
#
# public/assets and the vendor packages leave too: each gets its
# own layer below. Only the autoloader stays, as it maps the app's
# own classes and changes with them.
# ============================================================
FROM app AS runtime-files

RUN rm -rf \
    docker \
    public/assets \
    resources/css \
    resources/js \
    .npmrc \
    components.json \
    package.json \
    package-lock.json \
    pnpm-workspace.yaml \
    tsconfig.json \
    vite.config.ts \
    && find vendor -mindepth 1 -maxdepth 1 \
    ! -name autoload.php \
    ! -name composer \
    -exec rm -rf {} +


# ============================================================
# Production (the default target, so it stays the last stage)
# Alpine, with pdo_mysql, redis, zip, pcntl and opcache built in, and GD
# added below.
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

# GD makes the feed's photo thumbnails (App\Support\PhotoThumbnail).
USER root
RUN install-php-extensions gd

# Nginx: .mjs goes out as JavaScript, the built .mjs and .wasm files are
# cached like the rest of public/build, and uploads handed out from the
# bucket at /files/ are kept, so each costs PHP one request.
COPY docker/nginx/mime-types.conf /etc/nginx/conf.d/mime-types.conf
COPY docker/nginx/uploads-cache-zone.conf /etc/nginx/conf.d/uploads-cache-zone.conf
COPY docker/nginx/build-assets.conf /etc/nginx/server-opts.d/build-assets.conf
COPY docker/nginx/uploads-cache.conf /etc/nginx/server-opts.d/uploads-cache.conf

# One layer each, from least to most often changed, so a deploy only
# ships and stores the layers that changed: usually the app and its build.
# COPY --link cannot resolve user names; 82:82 is www-data on Alpine.
COPY --link --chown=82:82 \
    public/assets \
    /var/www/html/public/assets

COPY --link --from=composer-dependencies \
    --chown=82:82 \
    /var/www/html/vendor \
    /var/www/html/vendor

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
