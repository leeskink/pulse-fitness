# Pulse Fitness 
# Pulse Fitness Admin replacement

## Included
- `server/server.js`: Express/PostgreSQL API with session authentication, admin authorization, trainer CRUD/photos/availability, member goals, session scheduling, membership plans, promotions and admin creation.
- `src/components/AdminDashboard.jsx`: complete responsive admin workspace.
- `src/components/Auth.jsx`: member registration/login and admin redirect.
- `vite.config.js`: `/api` proxy to the backend.

## Apply
Copy the included files into the matching paths in your existing project, replacing those files.

Keep your existing `src/App.jsx` homepage components. It already imports `AdminDashboard` and routes `/admin` to it. In its session-check and logout fetch calls, change the absolute `http://localhost:3000/api/...` URLs to relative `/api/...` URLs. Do not replace the rest of the homepage. In `Auth.jsx`, the requests already use relative URLs.

## Run
Terminal 1:
```powershell
cd C:\Users\leesk\pulse-fitness\server
npm.cmd run dev
```
Terminal 2:
```powershell
cd C:\Users\leesk\pulse-fitness
npm.cmd run dev
```
Open the Vite URL shown in Terminal 2 (currently expected `http://localhost:5180`).

## Database notes
The server creates the new admin feature tables on startup. It expects your existing `users` table to have `id`, `full_name`, `email`, `password_hash`; it adds `role` and `created_at` if missing. It expects your existing `user_sessions` table to already exist, as in your current setup.

Public registration intentionally creates members only. An existing admin creates additional admins from the Administrators section. If no admin account currently exists, promote your trusted existing account once using a SQL query in your database console:
```sql
UPDATE users SET role = 'admin' WHERE email = 'YOUR_OWN_EMAIL';
```
Replace the email with your own account email before running it. Do not expose your database URL or session secret.

## Important implementation boundary
Trainer photos are stored as data URLs in PostgreSQL. This is suitable for small demo images (the UI enforces 5 MB per image); for production, use object storage instead. Scheduling prevents overlapping sessions for the same trainer, but does not yet enforce trainer availability windows or member double-booking. Prices/promotions are saved in admin tables; connecting them to a public checkout/payment flow is a separate integration.
