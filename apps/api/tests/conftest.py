"""Load the local API env before tests import the application."""

from respondly_api.core.env import load_env

load_env()
