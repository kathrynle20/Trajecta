const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const router = express.Router();

console.log("exam router");

// Python configuration
const pythonPath = "C:\\Users\\256bit.by\\AppData\\Local\\Programs\\Python\\Python39\\python.exe";
const scriptPath = path.join(__dirname, "../db_python/script.py");

router.post('/run1', (req, res) => {
  const question = req.body.question || "";

  let out = "";
  let err = "";

  const py = spawn(pythonPath, [scriptPath, question], { 
    cwd: path.join(__dirname, "../db_python") 
  });

  py.stdout.on("data", (d) => (out += d));
  py.stderr.on("data", (d) => (err += d));

  py.on("close", (code) => {
    if (err) {
      return res.json({
        input: question,
        output: null,
        error: `Python error: ${err}`
      });
    }

    try {
      const result = JSON.parse(out);
      if (result.error) {
        res.json({
          input: question,
          output: null,
          error: result.error
        });
      } else {
        res.json({
          input: result.input,
          output: result.output,
          error: null
        });
      }
    } catch (e) {
      res.json({
        input: question,
        output: null,
        error: `Unexpected output: ${out}`
      });
    }
  });
});

module.exports = router;