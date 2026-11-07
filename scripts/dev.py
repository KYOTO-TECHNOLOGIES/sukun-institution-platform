"""Local development helper. Uses a separate ignored SQLite database."""
import argparse
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parent.parent
BACKEND=ROOT/'institution_management_application/sukun_lms'
VENV=ROOT/'institution_management_application/venv'
PYTHON=VENV/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
FRONTEND=ROOT/'sukun_lms_frontend'


def config():
    local=ROOT/'.local'; local.mkdir(exist_ok=True)
    file=local/'demo.json'
    if file.exists(): data=json.loads(file.read_text())
    else:
        data={'password':'Sukun!'+secrets.token_urlsafe(16),'secret_key':secrets.token_urlsafe(64),
              'database_url':'sqlite:///'+(local/'demo.sqlite3').as_posix()}
        file.write_text(json.dumps(data,indent=2))
    roles=['Administrator','Teacher','Marketing','Admissions','Accountant','Librarian','HR','Front desk','Parent','Principal']
    text='# Local demo access\n\nURL: http://127.0.0.1:5173\n\nPassword: '+data['password']+'\n\n'
    text+='\n'.join(role+': +919900001'+str(i).zfill(3) for i,role in enumerate(roles,1))
    text+='\nStudent: +919900002001\n\nThese credentials are for the isolated local demo only.\n'
    (local/'DEMO_ACCESS.md').write_text(text)
    return data


def environment():
    data=config()
    return {**os.environ,'DEBUG':'True','SECRET_KEY':data['secret_key'],'DATABASE_URL':data['database_url'],
            'DEMO_PASSWORD':data['password'],'ALLOWED_HOSTS':'localhost,127.0.0.1,testserver',
            'CSRF_TRUSTED_ORIGINS':'http://127.0.0.1:5173,http://localhost:5173',
            'JWT_COOKIE_SECURE':'False','CSRF_COOKIE_SECURE':'False','SESSION_COOKIE_SECURE':'False',
            'SECURE_SSL_REDIRECT':'False'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['setup','seed','api','web','test'])
    args=parser.parse_args()
    env=environment()
    def backend(*command): subprocess.run([str(PYTHON),'manage.py',*command],cwd=BACKEND,env=env,check=True)
    npm=shutil.which('npm.cmd' if os.name=='nt' else 'npm')
    if args.command=='setup':
        if not PYTHON.exists(): subprocess.run([sys.executable,'-m','venv',str(VENV)],check=True)
        subprocess.run([str(PYTHON),'-m','pip','install','-r','requirements.txt'],cwd=BACKEND,check=True)
        if not npm: raise SystemExit('Install Node.js 22 or later first.')
        subprocess.run([npm,'ci'],cwd=FRONTEND,check=True)
        backend('migrate','--noinput');backend('seed_demo')
        print('Ready. Demo credentials: .local/DEMO_ACCESS.md')
    elif args.command=='seed':
        backend('migrate','--noinput');backend('seed_demo')
    elif args.command=='api': backend('runserver','127.0.0.1:8000','--noreload')
    elif args.command=='web':
        if not npm: raise SystemExit('Node.js is required.')
        subprocess.run([npm,'run','dev','--','--host','127.0.0.1','--port','5173','--strictPort'],cwd=FRONTEND,env=env,check=True)
    elif args.command=='test': backend('test','--noinput')


if __name__=='__main__': main()
