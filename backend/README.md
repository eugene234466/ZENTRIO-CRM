# Backend database setup

The backend reads `backend/.env` automatically. Start with the template:

```powershell
Copy-Item backend/.env.example backend/.env
```

## SQLite route testing

For a database that needs no server, uncomment the SQLite `DATABASE_URL` in
`backend/.env` and change its path to your workspace location, then run:

```powershell
Push-Location backend
..\.venv\Scripts\Activate.ps1
python -m flask --app app db upgrade
python seed_demo.py
python run.py
Pop-Location
```

The demo accounts are `admin` / `admin1234` and `staff` / `staff1234` by
default. Set `ADMIN_PASSWORD` and `STAFF_PASSWORD` in `.env` before seeding to
use different local passwords. Existing accounts are not overwritten.

## MySQL route testing

Create a database named `zentrio` and a user with permission to it, then keep
the MySQL `DATABASE_URL` from the template. On this machine the installed
Windows service is named `MySQL267`; it must be running before migrations:

```powershell
Get-Service MySQL267
Start-Service MySQL267
Push-Location backend
..\.venv\Scripts\Activate.ps1
python -m flask --app app db upgrade
python seed_demo.py
python run.py
Pop-Location
```

The API is then available at `http://127.0.0.1:5000`. The automated tests use
an isolated in-memory SQLite database and do not require MySQL:

```powershell
\.venv\Scripts\python.exe -m pytest backend/tests -q
```