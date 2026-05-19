import os
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager

# Read from environment variables (fallback to defaults if not set for some reason)
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "postgres")
DB_USER = os.environ.get("DB_USERNAME", "postgres")
DB_PASS = os.environ.get("DB_PASSWORD", "postgres")

# Initialize connection pool
try:
    connection_pool = psycopg2.pool.SimpleConnectionPool(
        1, 10,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    if connection_pool:
        print("✅ Connection pool created successfully")
except Exception as e:
    print(f"❌ Error creating connection pool: {e}")
    connection_pool = None

@contextmanager
def get_db_connection():
    if not connection_pool:
        raise Exception("Database connection pool is not initialized")
    
    conn = connection_pool.getconn()
    try:
        yield conn
    finally:
        connection_pool.putconn(conn)
