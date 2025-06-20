from datetime import datetime, timezone


def normalize_to_utc(dt: datetime | None) -> datetime | None:
    """Return datetime with UTC tzinfo if not already set."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
