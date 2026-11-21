from datetime import datetime, timezone, timedelta
from typing import Optional

# Asia/Dhaka Timezone: UTC + 6 hours
DHAKA_TZ = timezone(timedelta(hours=6))

def dhaka_now() -> datetime:
    """Returns current aware datetime in Asia/Dhaka (UTC+6)"""
    return datetime.now(DHAKA_TZ)

def dhaka_now_naive() -> datetime:
    """Returns current naive datetime representing Asia/Dhaka local time
    (compatible with SQLite DateTime columns)"""
    return datetime.now(DHAKA_TZ).replace(tzinfo=None)

def dhaka_today_str() -> str:
    """Returns YYYY-MM-DD string in Asia/Dhaka local time"""
    return datetime.now(DHAKA_TZ).strftime("%Y-%m-%d")

def dhaka_current_month() -> str:
    """Returns YYYY-MM string in Asia/Dhaka local time"""
    return datetime.now(DHAKA_TZ).strftime("%Y-%m")

def format_dhaka_time(dt: Optional[datetime], fmt: str = "%Y-%m-%d %I:%M %p") -> str:
    """Formats datetime in Asia/Dhaka timezone"""
    if not dt:
        return ""
    if dt.tzinfo is None:
        # If naive from SQLite, treat as Dhaka local time
        return dt.strftime(fmt)
    # If aware, convert to Dhaka timezone
    return dt.astimezone(DHAKA_TZ).strftime(fmt)
