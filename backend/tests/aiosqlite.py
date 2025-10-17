"""Minimal aiosqlite stub for test environment without external dependency."""

from __future__ import annotations

import asyncio
import functools
import sqlite3
from typing import Any, Iterable

__all__ = [
    'connect',
    'Error',
    'OperationalError',
    'DatabaseError',
    'IntegrityError',
    'NotSupportedError',
    'ProgrammingError',
    'sqlite_version',
    'sqlite_version_info',
]

Error = sqlite3.Error
OperationalError = sqlite3.OperationalError
DatabaseError = sqlite3.DatabaseError
IntegrityError = sqlite3.IntegrityError
NotSupportedError = sqlite3.NotSupportedError
ProgrammingError = sqlite3.ProgrammingError
sqlite_version = sqlite3.sqlite_version
sqlite_version_info = sqlite3.sqlite_version_info


class Cursor:
    def __init__(self, connection: 'Connection', cursor: sqlite3.Cursor, loop: asyncio.AbstractEventLoop):
        self._connection = connection
        self._cursor = cursor
        self._loop = loop

    async def execute(self, sql: str, parameters: Iterable[Any] | None = None):
        await self._run(self._cursor.execute, sql, tuple(parameters or ()))
        return self

    async def executemany(self, sql: str, seq_of_parameters):
        await self._run(self._cursor.executemany, sql, seq_of_parameters)
        return self

    async def fetchone(self):
        return await self._run(self._cursor.fetchone)

    async def fetchall(self):
        return await self._run(self._cursor.fetchall)

    async def fetchmany(self, size: int | None = None):
        if size is None:
            return await self._run(self._cursor.fetchmany)
        return await self._run(self._cursor.fetchmany, size)

    @property
    def rowcount(self) -> int:
        return self._cursor.rowcount

    @property
    def lastrowid(self) -> int:
        return self._cursor.lastrowid

    @property
    def description(self):
        return self._cursor.description

    async def close(self):
        await self._run(self._cursor.close)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        await self.close()

    async def _run(self, func, *args):
        return func(*args)


class Connection:
    def __init__(self, conn: sqlite3.Connection, loop: asyncio.AbstractEventLoop):
        self._conn = conn
        self._loop = loop

    async def cursor(self) -> Cursor:
        cursor = self._conn.cursor()
        return Cursor(self, cursor, self._loop)

    async def execute(self, sql: str, parameters: Iterable[Any] | None = None):
        cursor = await self.cursor()
        await cursor.execute(sql, parameters)
        return cursor

    async def executemany(self, sql: str, seq_of_parameters):
        cursor = await self.cursor()
        await cursor.executemany(sql, seq_of_parameters)
        return cursor

    async def commit(self):
        self._conn.commit()

    async def rollback(self):
        self._conn.rollback()

    async def close(self):
        self._conn.close()

    @property
    def total_changes(self) -> int:
        return self._conn.total_changes

    @property
    def in_transaction(self) -> bool:
        return self._conn.in_transaction

    @property
    def isolation_level(self) -> str | None:
        return self._conn.isolation_level

    @isolation_level.setter
    def isolation_level(self, value: str | None):
        self._conn.isolation_level = value

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if exc:
            await self.rollback()
        else:
            await self.commit()
        await self.close()

    async def create_function(self, *args, **kwargs):
        self._conn.create_function(*args, **kwargs)

    async def create_aggregate(self, *args, **kwargs):
        self._conn.create_aggregate(*args, **kwargs)

    async def create_collation(self, *args, **kwargs):
        self._conn.create_collation(*args, **kwargs)


class ConnectionTask:
    def __init__(self, database: str, kwargs: dict[str, Any]):
        self._database = database
        self._kwargs = kwargs
        self._kwargs.setdefault('check_same_thread', False)
        self.daemon = False

    def __await__(self):
        async def _inner():
            loop = asyncio.get_running_loop()
            conn = sqlite3.connect(self._database, **self._kwargs)
            return Connection(conn, loop)

        return _inner().__await__()


def connect(database: str, **kwargs) -> ConnectionTask:
    return ConnectionTask(database, kwargs)
