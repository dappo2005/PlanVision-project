"""Safe inputs for operator-run scripts; never log credential values."""
import getpass
import os
import sys


def required_env(name):
    value = os.getenv(name)
    if not value or not value.strip():
        raise ValueError(f"Required environment variable is missing: {name}")
    return value


def new_account_password(name):
    value = os.getenv(name)
    if not value:
        if not sys.stdin.isatty():
            raise ValueError(f"Set {name} securely or run in an interactive terminal")
        value = getpass.getpass("New account password (hidden): ")
        if value != getpass.getpass("Confirm password (hidden): "):
            raise ValueError("Passwords do not match")
    if len(value) < 12 or len(value.encode("utf-8")) > 72:
        raise ValueError("Use at least 12 characters and at most 72 UTF-8 bytes")
    return value
