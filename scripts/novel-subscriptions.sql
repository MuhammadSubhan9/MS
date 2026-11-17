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

-- Only addresses confirmed by an affirmative email reply are eligible to receive the release.
CREATE VIEW IF NOT EXISTS novel_release_recipients AS
SELECT id, email, unsubscribe_token FROM novel_subscribers
WHERE consent_version = 'novel-release-confirmed-v1' AND notified_at IS NULL;

-- Counting the insert and applying the limit in the same transaction also covers
-- concurrent submissions. A duplicate address never fires this trigger.
CREATE TRIGGER IF NOT EXISTS novel_daily_insert AFTER INSERT ON novel_subscribers
BEGIN
  INSERT INTO novel_signup_limits (key, expires_at)
  VALUES ('daily:' || (unixepoch() / 86400), (unixepoch() / 86400 + 1) * 86400)
  ON CONFLICT(key) DO UPDATE SET count = count + 1;
  SELECT CASE WHEN (SELECT count FROM novel_signup_limits
    WHERE key = 'daily:' || (unixepoch() / 86400)) > 200
    THEN RAISE(ABORT, 'novel_daily_limit') END;
END;
