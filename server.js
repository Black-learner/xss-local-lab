// server.js - XSS Local Lab (educational)
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1) Vulnerable page - shows a comment form and unsafely injects input into HTML
app.get("/vulnerable", (req, res) => {
  // set a non-HttpOnly demo cookie so document.cookie can read it in the browser
  res.setHeader("Set-Cookie", "demoSession=LOCAL-DEMO-12345; Path=/; Max-Age=3600");
  res.type("html").send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Vulnerable Demo Page</title>
        <style>body{font-family:Arial;margin:24px} .comment{padding:8px;border-bottom:1px solid #ddd}</style>
      </head>
      <body>
        <h2>Vulnerable Page (local only)</h2>
        <p>This page sets a non-HttpOnly cookie and demonstrates an XSS injection vulnerability.</p>

        <form id="form" onsubmit="return false;">
          <input id="input" placeholder='Enter comment or paste payload: &lt;script&gt;...&lt;/script&gt;' size="80" />
          <button id="post">Post</button>
        </form>

        <div id="comments" style="margin-top:18px;">
          <h3>Comments</h3>
        </div>

        <script>
          document.getElementById('post').addEventListener('click', () => {
            const v = document.getElementById('input').value;
            // ======= VULNERABLE BEHAVIOR =======
           const c = document.createElement('div');
            c.className = 'comment';

            // Insert the HTML (this may create <script> elements that won't automatically run)
            c.innerHTML = v;
            document.getElementById('comments').appendChild(c);

            // Find any script tags inside the newly added element and execute them properly
            const scripts = Array.from(c.querySelectorAll('script'));
            scripts.forEach((oldScript) => {
              const newScript = document.createElement('script');
              // copy attributes like src/type if present (optional)
              Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
              // inline script content:
              newScript.text = oldScript.textContent;
              // append to head so it executes
              document.head.appendChild(newScript);
              // (optionally) remove the injected script tag so DOM stays clean
              newScript.parentNode.removeChild(newScript);
            });

          });

          console.log("document.cookie on this page:", document.cookie);
        </script>
      </body>
    </html>
  `);
});

// 2) Receiver endpoint (attacker side, local): logs and appends to local file
app.get("/steal", (req, res) => {
  const stolen = req.query.cookie || "(none)";
  const entry = `${new Date().toISOString()}  IP=${req.ip}  UA=${req.get('User-Agent') || ''}  cookie=${stolen}\n`;

  console.log("▶ Received (simulated exfil):", entry.trim());

  try {
    fs.appendFileSync(path.join(__dirname, "received_log.txt"), entry, "utf8");
  } catch (err) {
    console.error("Failed to write received_log.txt:", err.message);
  }

  res.type("text").send("OK (demo receiver).");
});

app.get("/", (req, res) => {
  res.type("html").send(`
    <h2>XSS Local Lab</h2>
    <ul>
      <li><a href="/vulnerable" target="_blank">Open Vulnerable Page</a></li>
      <li>Receiver endpoint: <code>/steal?cookie=...</code> (logs to received_log.txt)</li>
    </ul>
    <p>This local server sets a non-HttpOnly cookie for demonstration. Check DevTools -> Application -> Cookies to view it.</p>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`XSS local lab running at http://localhost:${PORT}`);
  console.log("Vulnerable page: http://localhost:" + PORT + "/vulnerable");
});
