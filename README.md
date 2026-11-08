# SMS Management System

This project contains a React + TypeScript frontend, a Node.js + Express + TypeScript backend, and a MySQL schema for the SMS management platform described in the project brief.

## Architecture

- frontend/: Vite React application with Tailwind CSS and dashboard shell
- backend/: Express REST API following OOP and repository/service patterns
- database/: SQL schema for MySQL

## Phase 1 complete

The project skeleton and architecture are in place, ready for database setup and feature implementation in subsequent phases.

## Phase 2: Database configuration

The repository now includes a normalized MySQL schema and migration files for the SMS management system.

### Files added

- [database/schema.sql](./database/schema.sql): consolidated DDL for the base platform schema.
- [backend/migrations/001_create_schema.sql](./backend/migrations/001_create_schema.sql): initial schema migration.
- [backend/migrations/002_seed_default_roles.sql](./backend/migrations/002_seed_default_roles.sql): default RBAC roles and permissions.
- [backend/migrations/003_create_api_and_server_tables.sql](./backend/migrations/003_create_api_and_server_tables.sql): API client and SMS server tables.
- [backend/src/config/database.ts](./backend/src/config/database.ts): MySQL pool configuration and connection check helper.

### Local setup

1. Start MySQL in XAMPP and ensure phpMyAdmin is available.
2. Copy backend/.env.example to backend/.env and set your local DB values.
3. Import the schema using phpMyAdmin or run the SQL file in MySQL Workbench.
4. If the base database already exists, also run `backend/migrations/003_create_api_and_server_tables.sql`.
5. In frontend/: npm install && npm run dev
6. In backend/: npm install && npm run dev

### Existing database authentication

The backend authenticates against the existing `users` table using its `username` or `email` and bcrypt password hash. Active database roles are mapped to application roles; unknown roles, including `Reseller`, receive viewer access until explicitly mapped. Public registration creates a regular User account and does not accept a client-selected role.

Keep database credentials in the local `backend/.env` file. Do not send database or account passwords through chat.

### Country coverages

The Settings > Country Coverages page manages the existing `setting_coverages` table. Quick Send loads distinct active country names from that table through the authenticated `GET /api/setting-coverages/countries` endpoint; country options are not hardcoded in the frontend.

### MySQL import examples

- phpMyAdmin: import [database/schema.sql](./database/schema.sql)
- MySQL CLI: mysql -u root -p < database/schema.sql
