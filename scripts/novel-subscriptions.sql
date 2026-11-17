CREATE TABLE IF NOT EXISTS novel_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  consent_version TEXT NOT NULL,
  subscribed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notified_at TEXT
);

CREATE TABLE IF NOT EXISTS novel_signup_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS novel_signup_limits_expiry
ON novel_signup_limits (expires_at);
