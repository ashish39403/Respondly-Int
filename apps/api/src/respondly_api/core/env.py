"""Load local env files without overriding the process environment."""

import os
from pathlib import Path

_API_ROOT = Path(__file__).resolve().parents[3]
_REPO_ROOT = _API_ROOT.parent.parent
_LOADED = False


def load_env() -> None:
    global _LOADED
    if _LOADED:
        return
    for path in (_REPO_ROOT / ".env", _API_ROOT / ".env"):
        _apply_file(path)
    _LOADED = True


def _apply_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value
