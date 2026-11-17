CREATE TABLE IF NOT EXISTS now_page (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL CHECK (revision > 0),
  date TEXT NOT NULL,
  text TEXT NOT NULL
);
