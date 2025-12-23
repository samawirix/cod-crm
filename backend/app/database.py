"""
Database Configuration and Session Management

This module provides database configuration and async session management
for the CRM application using SQLAlchemy 2.0.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker
)
from sqlalchemy.pool import NullPool, QueuePool

from app.models.base import Base


class DatabaseConfig:
    """Database configuration and connection management."""
    
    def __init__(
        self,
        database_url: str,
        echo: bool = False,
        pool_size: int = 5,
        max_overflow: int = 10,
        pool_pre_ping: bool = True,
        use_null_pool: bool = False
    ):
        """
        Initialize database configuration.
        
        Args:
            database_url: Database connection URL (must start with postgresql+asyncpg://)
            echo: Enable SQL query logging
            pool_size: Number of connections to maintain in the pool
            max_overflow: Maximum overflow connections beyond pool_size
            pool_pre_ping: Enable connection health checks
            use_null_pool: Use NullPool (no connection pooling, useful for serverless)
        """
        self.database_url = database_url
        self.echo = echo
        
        # Create async engine
        engine_kwargs = {
            "echo": echo,
            "pool_pre_ping": pool_pre_ping,
        }
        
        if use_null_pool:
            engine_kwargs["poolclass"] = NullPool
        else:
            engine_kwargs["poolclass"] = QueuePool
            engine_kwargs["pool_size"] = pool_size
            engine_kwargs["max_overflow"] = max_overflow
        
        self.engine: AsyncEngine = create_async_engine(
            database_url,
            **engine_kwargs
        )
        
        # Create async session factory
        self.async_session_maker = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )
    
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Get an async database session.
        
        Yields:
            AsyncSession instance
            
        Example:
            async with db_config.get_session() as session:
                # Use session
                pass
        """
        async with self.async_session_maker() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def create_tables(self):
        """
        Create all database tables.
        
        Note: In production, use Alembic migrations instead.
        """
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    async def drop_tables(self):
        """
        Drop all database tables.
        
        Warning: This will delete all data!
        """
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    async def close(self):
        """Close the database engine and all connections."""
        await self.engine.dispose()


# Example configurations for different environments

def get_development_config() -> DatabaseConfig:
    """
    Get database configuration for development environment.
    
    Returns:
        DatabaseConfig for development
    """
    return DatabaseConfig(
        database_url="postgresql+asyncpg://user:password@localhost:5432/crm_dev",
        echo=True,  # Log SQL queries in development
        pool_size=5,
        max_overflow=10
    )


def get_production_config(database_url: str) -> DatabaseConfig:
    """
    Get database configuration for production environment.
    
    Args:
        database_url: Production database URL
        
    Returns:
        DatabaseConfig for production
    """
    return DatabaseConfig(
        database_url=database_url,
        echo=False,  # No SQL logging in production
        pool_size=20,
        max_overflow=40,
        pool_pre_ping=True
    )


def get_testing_config() -> DatabaseConfig:
    """
    Get database configuration for testing environment.
    
    Returns:
        DatabaseConfig for testing
    """
    return DatabaseConfig(
        database_url="postgresql+asyncpg://user:password@localhost:5432/crm_test",
        echo=False,
        use_null_pool=True  # No pooling for tests
    )


# Example usage
"""
# Development
db_config = get_development_config()

# Create tables (for initial setup)
await db_config.create_tables()

# Use in endpoints/services
async def some_endpoint():
    async with db_config.get_session() as session:
        leads, total = await LeadService.get_leads(
            db=session,
            status=LeadStatus.NEW
        )
        return leads

# Cleanup on shutdown
await db_config.close()
"""

