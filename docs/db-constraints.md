# Database Constraints for Voice_Studio_blocks

To prevent duplicate block records per project and enable reliable upsert operations, create a unique composite index on the `Voice_Studio_blocks` table:

```
CREATE UNIQUE INDEX IF NOT EXISTS unique_project_block
ON "Voice_Studio_blocks"(project_id, block_index);
```

Notes:
- Ensure the table name matches your Hasura/Postgres schema. If your table is named differently, adjust accordingly.
- With this unique index in place, you can safely use Hasura `on_conflict` upserts keyed by `(project_id, block_index)`.
- For flows where `block_index` is not available, use a deterministic `block_index` derived from the text (e.g., a hash of normalized text).

Example deterministic index when no explicit index is present:
```
const normalizedText = text.trim().replace(/\s+/g, ' ');
const blockIndex = `text:${normalizedText.substring(0, 64)}`; // or a hash
```

This ensures every block is uniquely identified per project and cannot be inserted twice.