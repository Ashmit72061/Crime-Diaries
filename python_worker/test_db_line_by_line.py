import sys
import os

print("1. Importing dotenv...", flush=True)
from dotenv import load_dotenv
print("2. Importing create_engine...", flush=True)
from sqlalchemy import create_engine

print("3. Loading dotenv...", flush=True)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../backend/.env'))
load_dotenv()

print("4. Getting db_client...", flush=True)
db_client = os.getenv('DB_CLIENT', 'sqlite3')
print(f"db_client: {db_client}", flush=True)

if db_client == 'sqlite3':
    sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend/database.sqlite'))
    db_url = f"sqlite:///{sqlite_path}"
    print(f"5. Resolving SQLite path: {sqlite_path}", flush=True)
else:
    db_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5435/pharos_db')
    print("5. Resolving Postgres URL", flush=True)

print("6. Creating engine...", flush=True)
engine = create_engine(db_url)

print("7. Engine created! Testing engine connection...", flush=True)
with engine.connect() as conn:
    print("8. Connection succeeded!", flush=True)

print("Finished direct line-by-line test.", flush=True)
