CREATE TABLE IF NOT EXISTS study_notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    node_id VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_notes_user_node ON study_notes (user_id, node_id, updated_at DESC);
