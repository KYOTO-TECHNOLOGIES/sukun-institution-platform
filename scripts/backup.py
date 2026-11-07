"""Create a consistent local SQLite backup; PostgreSQL deployments use pg_dump."""
import argparse
from datetime import datetime, timezone
from pathlib import Path
import sqlite3

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('database',type=Path)
parser.add_argument('--output-dir',type=Path,default=Path('.local/backups'))
args=parser.parse_args()
source=args.database.resolve()
if not source.is_file(): raise SystemExit('Database not found: '+str(source))
args.output_dir.mkdir(parents=True,exist_ok=True)
destination=args.output_dir/(source.stem+'-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.sqlite3')
if destination.exists(): raise SystemExit('Backup path already exists; retry in one second.')
with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as src:
    with sqlite3.connect(destination) as dst: src.backup(dst)
print('Backup created:',destination.resolve())
