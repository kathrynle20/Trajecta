const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const port = 3000;

const pythonPath = "C:\\Users\\256bit.by\\AppData\\Local\\Programs\\Python\\Python39\\python.exe";
const scriptPath = path.join(__dirname, "script.py");

app.use(bodyParser.urlencoded({ extended: true }));

// Serve input form
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Python + Anthropic</title></head>
      <body style="font-family:sans-serif; margin:2rem;">
        <h1>Ask Anthropic via Python</h1>
        <form method="POST" action="/ask">
          <input type="text" name="question" style="width:300px;" placeholder="Enter your question" />
          <button type="submit">Ask</button>
        </form>
      </body>
    </html>
  `);
});

// Handle form submission
app.post("/ask", (req, res) => {
  const question = req.body.question || "";

  let out = "";
  let err = "";

  const py = spawn(pythonPath, [scriptPath, question], { cwd: __dirname });

  py.stdout.on("data", (d) => (out += d));
  py.stderr.on("data", (d) => (err += d));

  py.on("close", (code) => {
    if (err) return res.send(`<h2>Python error:</h2><pre>${err}</pre>`);

    try {
      const result = JSON.parse(out);
      if (result.error) {
        res.send(`<h2>Error</h2><pre>${result.error}</pre>`);
      } else {
        res.send(`
          <html>
            <head><title>Result</title></head>
            <body style="font-family:sans-serif; margin:2rem;">
              <h1>Question</h1>
              <p>${result.input}</p>
              <h1>Answer</h1>
              <pre>${result.output}</pre>
              <a href="/">Ask another</a>
            </body>
          </html>
        `);
      }
    } catch (e) {
      res.send(`<h2>Unexpected Output</h2><pre>${out}</pre>`);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
