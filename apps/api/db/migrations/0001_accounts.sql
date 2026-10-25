-- One application account row per Neon Auth user.
-- The password hash stays in Neon Auth. This table is not a workspace.

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.accounts (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    verified_at timestamptz NOT NULL
);
