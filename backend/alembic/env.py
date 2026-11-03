import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ---------------------------------------------------------------------------
# Make the app package importable from alembic/
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------------------
# Import all models so Alembic detects them for autogenerate
# ---------------------------------------------------------------------------
from app.database import Base  # noqa: E402
from app import models  # noqa: F401, E402

# ---------------------------------------------------------------------------
# Alembic Config object
# ---------------------------------------------------------------------------
config = context.config

# Read logging configuration from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Use our project's metadata for autogenerate
target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Read DATABASE_URL from environment (via dotenv or system env)
# ---------------------------------------------------------------------------
def get_url() -> str:
    from dotenv import load_dotenv
    # Load .env relative to the project root (two levels up from alembic/)
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    load_dotenv(env_path, override=False)

    url = os.getenv("DATABASE_URL", "")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
