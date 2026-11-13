# PetSystem V3

A web application for a pet shop and veterinary clinic, built as a real freelance project: client and pet records, services, appointments and visits, with separate access for administration, reception and veterinarians.

[Português (Brasil)](README.pt-BR.md)

> The user interface is in Brazilian Portuguese, and the guides under `docs/` are currently written in Portuguese.

## Table of contents

- [Overview](#overview)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Engineering notes](#engineering-notes)
- [Roles and permissions](#roles-and-permissions)
- [Screenshots](#screenshots)
- [Getting started](#getting-started)
- [Testing and build](#testing-and-build)
- [Documentation](#documentation)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Author](#author)

## Overview

PetSystem V3 is the successor to PetSystem V2. It was rebuilt as a Laravel REST API and a separate React application, with session-based authentication, authorization enforced on the backend, and a SQLite demo environment.

This repository documents the implemented scope together with its validation evidence. Final acceptance is still in progress.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Backend | PHP 8.2+, Laravel 12, Laravel Sanctum 4 |
| Frontend | React 18, React Router 6, Vite 6, Axios |
| Local demo database | SQLite |
| Testing | PHPUnit 11 and `node:test` |

## Architecture

```text
React 18 + Vite  ──(Axios, session cookie + CSRF)──>  Laravel 12 REST API  ──>  SQLite (demo)
   frontend/                                           backend/ (Sanctum)
```

```text
backend/    Laravel API: controllers, form requests, models, migrations, seeders, tests
frontend/   React client: features, shared components, pages, routes, services
scripts/    Windows helpers: start, stop, verify, create a user
docs/       Setup, backup, security and validation guides (Portuguese)
```

## Features

- Session login and logout, CSRF protection, and blocking of inactive users.
- Clients and pets with a record, history, and a six-digit public code for each pet.
- Services with price, duration, and activation/deactivation by the administrator.
- Appointments with confirmation, cancellation, and rescheduling with a reason, plus overlap checking for the same pet.
- Visits (attendances), either walk-in or started from a confirmed appointment, with clinical notes, completion, and a recorded amount and payment method.
- Dashboard with counters, today's upcoming appointments, monthly revenue, and a seven-day revenue chart, all based on completed visits.
- Search, filters, and client-side pagination where relevant, with validation and loading, error, and empty states.
- Responsive side navigation with text labels, active-section indication, and keyboard focus.

Payment is an internal record only: there is no bank processing, no payment-provider integration, and no tax-document issuing. Revenue is the sum of completed visits and does not reconcile actual receipts.

## Engineering notes

- **Authorization lives in the API.** Laravel Gates and route middleware decide what each role may do. The interface mirrors those rules but is never the barrier.
- **Role-based response redaction.** A middleware removes financial fields from veterinarian responses and clinical notes from receptionist responses, including nested histories.
- **Safer scheduling.** The overlap check runs again inside the write transaction, with pessimistic row locking on database drivers that support it.
- **Historical accuracy.** Appointments and visits keep the price and duration of the services at the time they were recorded, so later price changes do not rewrite past records.
- **Isolated tests.** PHP tests run on in-memory SQLite and never touch the demo database.

## Roles and permissions

Permissions are enforced by the API in addition to the interface controls.

| Operation | Administrator (`admin`) | Reception (`receptionist`) | Veterinarian (`veterinarian`) |
| --- | --- | --- | --- |
| View, create, and edit clients and pets | Yes | Yes | Yes |
| Delete clients/pets without blocking links | Yes | Yes | No |
| View services | Yes | Yes | Yes, without price |
| Create, edit, and delete/deactivate services | Yes | No | No |
| View, create, and edit appointments | Yes | Yes | Yes |
| Delete appointments | Yes | No | No |
| View and start visits | Yes | Yes | Yes |
| Edit clinical notes and complete a visit | Yes | No | Yes |
| Record amounts and payment; view revenue | Yes | Yes | No |
| Delete visits | No | No | No |

The basic pet record, allergies, and operational alerts are shared by all three roles. When a veterinarian completes a visit, a clinical note is required; under the current rule, an administrator may complete a visit without one. Visits are permanent records.

## Screenshots

Real screenshots of the interface, provided by the owner and reviewed before publication. The examples show generic names; no personal contact details, credentials, or sensitive clinical data were identified. The images are unedited. See the [screenshot index](docs/img/README.md) for what each screen shows and the limits of this evidence.

### Dashboard

Operational indicators and the financial area of the administrator profile.

![PetSystem V3 administrator dashboard](docs/img/dashboard.png)

### Appointments

Search, date filter, and a list of sample appointments.

![Appointments with search and date filter](docs/img/agendamentos.png)

### Visits

The visits screen in its empty state, with access to the registration form.

![Visits screen with no records yet](docs/img/atendimentos.png)

### Pets

Pet list with public code, species, breed, and owner.

![Pet list with sample owners](docs/img/pets.png)

### Veterinarian profile

The veterinarian's dashboard, with operational indicators and no financial area.

![Veterinarian dashboard without financial indicators](docs/img/veterinario.png)

## Getting started

In the examples below, replace `C:\path\to\Petsystemv3` with the path to your copy of the project.

### Requirements

Windows with CMD, Git, PHP 8.2+ with the extensions Composer requires and `pdo_sqlite`, Composer 2, Node.js, and npm. The environment was validated with Node 24. The bundled scripts expect PHP at `C:\xampp\php\php.exe` and Node/npm on the `PATH`.

### Install dependencies

Install from the lockfiles, inside your copy of the project:

```bat
cd /d C:\path\to\Petsystemv3\backend
composer install
composer check-platform-reqs
cd ..\frontend
npm.cmd ci
```

### Configure the demo environment

On a fresh installation, copy [backend/.env.demo.example](backend/.env.demo.example) to `backend/.env.demo`. Set `DB_DATABASE` to the absolute path of `backend/database/petsystem_demo.sqlite` **in your copy**, and generate an application key only if `APP_KEY` is empty. Keep `APP_ENV=demo`, `DB_CONNECTION=sqlite`, and an empty `DB_URL`. The `.env.demo` file is private and is not tracked by Git.

Follow the [setup guide](docs/setup.md) to prepare a new database or to check an existing one. Preserve existing databases and keys, and take a [backup](docs/backup.md) before updating a demo that holds important data. Do not run `composer setup`, `migrate:fresh`, or seeders against an existing persistent database.

### Run with two CMD terminals

Once dependencies, environment, and database are ready, start Laravel in terminal 1:

```bat
cd /d C:\path\to\Petsystemv3\backend
C:\xampp\php\php.exe artisan --env=demo serve --host=127.0.0.1 --port=8000
```

Start React/Vite in terminal 2:

```bat
cd /d C:\path\to\Petsystemv3\frontend
set "PATH=C:\Program Files\nodejs;%PATH%"
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`; the API listens at `http://127.0.0.1:8000/api` by default. Use the same hostname for the whole session. The Node path above matches the validated installation; adjust it if needed. Press Ctrl+C in each terminal to stop the servers.

### Shortcut scripts

`scripts\iniciar.bat` can prepare a fresh SQLite database with fictional data and start both servers. On an existing database it may apply pending migrations, so read the guide and back up first. It reuses servers from the same copy and environment.

Create only the accounts you need with `scripts\criar-usuario.bat`, choosing the role and typing the password in the terminal. There is no default password. The original `.env` and the historical MySQL/MariaDB database are not needed for the demo.

## Testing and build

From the project root, the integrated check protects the demo database and runs the PHP tests on in-memory SQLite:

```bat
set "PATH=C:\Program Files\nodejs;%PATH%"
scripts\verificar.bat
```

To run only the frontend tests and the production build:

```bat
cd /d C:\path\to\Petsystemv3\frontend
set "PATH=C:\Program Files\nodejs;%PATH%"
node.exe --test
npm.cmd run build
```

`npm.cmd run verify` also runs the frontend tests followed by the build. Build output goes to `frontend/dist`, which Git ignores. Results and the limits of validation are in the [validation report](docs/homologacao.md), and the [manual checklist](docs/checklist-manual.md) covers functional acceptance per role.

## Documentation

The guides below are written in Portuguese.

- [Installation, demo environment, and startup troubleshooting](docs/setup.md)
- [SQLite backup and restore](docs/backup.md)
- [Manual acceptance checklist](docs/checklist-manual.md)
- [Validation results and open items](docs/homologacao.md)
- [Dependency audit and security notes](docs/seguranca-dependencias.md)

The versioned scripts cover starting the servers, stopping the identified servers, interactive user creation, a read-only inspection of the demo, and project verification. Never publish `.env` files, SQLite files, logs, backups, passwords, or real client data.

## Known limitations

- The local demo is not a validated production deployment. Hosting, HTTPS, secure cookies, disabled debug mode, infrastructure, and real backup restoration each need their own validation.
- Client-side pagination has not been validated for large data volumes or high concurrency.
- The schedule checks conflicts per pet. Scheduling per professional, notifications, and employee management through the interface are left for a future version.
- The audit recorded on 2026-11-08 keeps one moderate React Router advisory open, described in the security document. Do not assume the build resolves it.
- Screenshots demonstrate the interface; they do not replace the API authorization tests or full functional acceptance.

The `v1.0.0` release is subject to final validation and owner acceptance. This repository does not claim deployment or production readiness.

## Roadmap

- Define and validate the production environment: hosting, HTTPS, database, and backups.
- User management through the administrator interface.
- Scheduling per professional and internal notifications.
- Upgrade React Router to a major version without the open advisory.

## Author

**Natan da Luz Cândido** — [LinkedIn](https://www.linkedin.com/in/natandaluz/)
