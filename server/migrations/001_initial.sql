CREATE TABLE IF NOT EXISTS app_state (
  id smallint PRIMARY KEY CHECK (id = 1),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_state_payload_gin ON app_state USING gin(payload);
