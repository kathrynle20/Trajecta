// Exam.js
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const router = express.Router();

const pythonPath = "C:\\Users\\256bit.by\\AppData\\Local\\Programs\\Python\\Python39\\python.exe";
const scriptPath = path.join(__dirname, "../db_python/script.py");

function runPy(argObj) {
  return new Promise((resolve) => {
    let out = "", err = "";
    const py = spawn(pythonPath, [scriptPath, JSON.stringify(argObj)], {
      cwd: path.join(__dirname, "../db_python")
    });
    py.stdout.on("data", (d) => (out += d));
    py.stderr.on("data", (d) => (err += d));
    py.on("close", () => resolve({ out, err }));
  });
}

// Generate AI questions fast
router.post("/questions", async (req, res) => {
  const seed = req.body?.seed || {}; // { interests_hint: [...], language: "English", count_min, count_max }
  const { out, err } = await runPy({ mode: "questions", seed });
  if (err) return res.json({ error: `Python error: ${err}` });
  try {
    const result = JSON.parse(out);
    return res.json(result);
  } catch (e) {
    return res.json({ error: `Unexpected output: ${out}` });
  }
});

// Compute verdict
router.post("/verdict", async (req, res) => {
  const answers = req.body?.answers || {};
  const { out, err } = await runPy({ mode: "verdict", answers });
  if (err) return res.json({ error: `Python error: ${err}` });
  try {
    const result = JSON.parse(out);
    return res.json(result);
  } catch (e) {
    return res.json({ error: `Unexpected output: ${out}` });
  }
});

module.exports = router;
