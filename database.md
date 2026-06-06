## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `github_username` | `text` |  Unique |
| `github_node_id` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `display_name` | `text` |  Nullable |
| `provider_token` | `text` |  Nullable |
| `provider_refresh_tk` | `text` |  Nullable |
| `github_followers` | `int4` |  |
| `github_following` | `int4` |  |
| `updated_at` | `timestamptz` |  |

## Table `rooms`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `organizer_id` | `uuid` |  Nullable |
| `status` | `room_status` |  |
| `duration_seconds` | `int4` |  |
| `started_at` | `timestamptz` |  Nullable |
| `ends_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `room_code` | `varchar` |  Unique |

## Table `room_participants`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `room_id` | `uuid` |  |
| `baseline_followers` | `int4` |  |
| `baseline_following` | `int4` |  |
| `current_followers` | `int4` |  |
| `current_following` | `int4` |  |
| `score` | `numeric` |  |
| `joined_at` | `timestamptz` |  |

## Table `follow_ledger`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `room_id` | `uuid` |  |
| `follower_id` | `uuid` |  |
| `followee_id` | `uuid` |  |
| `sync_status` | `sync_status_type` |  |
| `sync_attempts` | `int4` |  |
| `synced_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |


