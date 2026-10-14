# Deployment

PHLGADIS ships as one Docker image (`Dockerfile`): Nginx and PHP-FPM on port 8080. Coolify builds it from the repository and runs it on the Hostinger VPS, with MySQL and Redis beside it as Coolify services.

## The image

| Stage               | What it does                                                                   |
| ------------------- | ------------------------------------------------------------------------------ |
| `node-dependencies` | `npm ci`                                                                       |
| `php-dependencies`  | `composer install --no-dev`, then the app's source and an optimized autoloader |
| `frontend`          | `vp build`, with PHP present so Wayfinder regenerates the typed routes         |
| `runtime-files`     | Drops the build-only sources (`resources/js`, `resources/css`, Node config)    |
| `production`        | `serversideup/php:8.5-fpm-nginx-alpine` with the app and `public/build`        |

- **Nothing private goes in.** `.dockerignore` keeps `.env`, `vendor`, `node_modules`, `storage`, tests and docs out of the build.
- **At each start** the container runs `storage:link` and `php artisan optimize` (config, routes, views and events). **Migrations never run by themselves** (`AUTORUN_LARAVEL_MIGRATION=false`).
- **Health check:** Laravel's `/up`.
- **Versions:** PHP 8.5 and Node 22, as in CI. OPcache keeps the code in memory, so a code change needs a new image.

## Coolify

**Application**

- **Build pack:** Dockerfile. **Port:** 8080. **Domain:** the site's https address.
- **Build variable:** `VITE_APP_NAME`, the browser tab's title. It defaults to PHLGADIS.

**Services:** MySQL, and Redis with `maxmemory-policy noeviction` and append-only persistence (see "Development and checks" in `docs/homepage.md`).

**Environment.** Secrets go in Coolify only, never in the repository. A changed variable needs a restart, because the config is cached at start.

| Variable                                                    | Value                                                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `APP_ENV`, `APP_DEBUG`                                      | `production`, `false`                                                                               |
| `APP_KEY`                                                   | From `php artisan key:generate --show`                                                              |
| `APP_URL`                                                   | The site's https address, used by links in e-mails and background jobs                              |
| `ADMIN_PASSWORD`                                            | The first administrator's password, for the first `db:seed`                                         |
| `DB_CONNECTION`                                             | `mysql`, with `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` and `DB_PASSWORD` from the service |
| `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION`         | `redis`                                                                                             |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`                | From the service. The image has phpredis, so `REDIS_CLIENT` may be `phpredis` or `predis`.          |
| `SESSION_SECURE_COOKIE`                                     | `true`                                                                                              |
| `LOG_CHANNEL`                                               | `stderr`, so the logs show in Coolify                                                               |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, … | The mail account                                                                                    |
| `FILESYSTEM_UPLOADS`, `SPACES_*`                            | See **Uploads**                                                                                     |

**Uploads** must outlive a redeploy. Either:

- **Spaces:** `FILESYSTEM_UPLOADS=spaces` and the `SPACES_*` settings, as on DigitalOcean. Nothing is kept on the server.
- **The VPS:** `FILESYSTEM_UPLOADS=local` and a persistent volume at `/var/www/html/storage/app`. It holds the public uploads (avatars, badges, carousel, posts) and the private monitoring and certificate files (e-signatures, logos). Use a Coolify volume mount, not a folder from the host: a host folder belongs to root, and the app runs as `www-data`.

**Scheduled task:** `php artisan schedule:run`, every minute (`* * * * *`), on the application. It drains the queue (event notices), releases certificates when events end, and runs the nightly HEIDA sync and the survey prune (`routes/console.php`). No queue worker or Horizon is needed.

## Deploying

**The first time,** on an empty database, in the application's terminal in Coolify:

```text
php artisan migrate --force
php artisan db:seed --force
```

The seed creates the roles, the first administrator (`admin@gmail.com` with `ADMIN_PASSWORD`), the regions, the HEIs and the surveys. Run it once only.

**After that,** deploy, then run `php artisan migrate --force` when the release has new migrations. To have each deploy migrate by itself, set `AUTORUN_LARAVEL_MIGRATION=true` in Coolify.

**On a PC,** `docker build -t phlgadis .` builds the same image. It needs the environment above to run.
