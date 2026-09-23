# Administration and RBAC

The administration area uses the Laravel React starter kit shell. Access is
enforced by Laravel gates on the server and mirrored in the interface so users
only see actions they can perform.

## Initial roles

| Role             | Carousel access                  |
| ---------------- | -------------------------------- |
| Administrator    | View, create, update, and delete |
| GAD Focal Person | View, create, and update         |
| HEI User         | View only                        |

New public registrations receive the `hei` role after the RBAC seed has been
run. The default seed creates `admin@gmail.com` with the initial password
`12345678` and assigns that account the `admin` role. Change the password after
the first login. Existing accounts without roles receive `hei`; no existing
account is promoted to Administrator just because it was created first.

The named permissions are `carousel.view`, `carousel.create`,
`carousel.update`, and `carousel.delete`. Routes and form requests enforce the
matching permission for each operation.

User and role management live under Settings and use the `users.*` and
`roles.*` permission groups. Administrators can create users, assign one or
more roles, and define custom roles from the permissions registered by the
application. Permission definitions remain code-owned so the interface cannot
invent abilities that have no protected route or behavior.

The Administrator role is system locked. The application also prevents users
from deleting their own account, deleting an assigned role, or removing the
last Administrator assignment.

## Carousel

Carousel records store a title, optional description, optional HTTPS
destination, active status, display order, and uploaded image. The required
title also provides the public image's accessible alternative text. Uploads
use Laravel's `public` disk under `carousel/`. Replacing or deleting a slide
also removes the old file.

The public homepage queries active slides by display order. If none exist, the
existing static homepage carousel remains visible as a fallback.

For a new environment, run:

```bash
php artisan migrate --seed
php artisan storage:link
```

`php artisan migrate:fresh --seed` recreates the tables and includes the
administrator, survey drafts, Region XII directory, and the 129 HEIs supplied
from the CHED list. Each HEI keeps its UII. The screenshots did not include
province or cluster, so the initial HEIs are under `Unassigned` until an
administrator maps them to the existing clusters. Running the seed again keeps
changed passwords, HEI edits, deactivations, and survey responses.
