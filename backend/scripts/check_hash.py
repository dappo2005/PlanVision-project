"""Compare supplied password/hash; no default credentials and no value logging."""
import bcrypt
from _safe_config import required_env

h = required_env('HASH').encode()
p = required_env('PASSWORD').encode()
try:
    print('check', bcrypt.checkpw(p, h))
except ValueError:
    raise SystemExit('Invalid bcrypt hash or password input')

