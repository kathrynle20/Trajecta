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
  const questions = req.body?.questions || [];
  const userAnswers = req.body?.answers || {};
  const advisorDescription = req.body?.advisor_description || "";
  const conversationTranscript = req.body?.conversation_transcript || "";
  const skillLevels = req.body?.skill_levels || [];
  
  const { out, err } = await runPy({ 
    mode: "verdict", 
    answers: {
      ...answers,
      questions: questions,
      answers: userAnswers,
      advisor_description: advisorDescription,
      conversation_transcript: conversationTranscript,
      skill_levels: skillLevels
    }
  });
  if (err) return res.json({ error: `Python error: ${err}` });
  try {
    const result = JSON.parse(out);
    return res.json(result);
  } catch (e) {
    return res.json({ error: `Unexpected output: ${out}` });
  }
});

// Add after your other routes
router.post("/rank", async (req, res) => {
  // expects { query: "econometrics", user: { interests: [...], top3: [...], advisor_description: "...", conversation_transcript: "...", skill_levels: [["Mathematics","Beginner"], ...] } }
  const arg = { mode: "rank", ...req.body };
  let out = "", err = "";
  const py = spawn(pythonPath, [scriptPath, JSON.stringify(arg)], {
    cwd: path.join(__dirname, "../db_python")
  });
  py.stdout.on("data", (d) => (out += d));
  py.stderr.on("data", (d) => (err += d));
  py.on("close", () => {
    if (err) return res.json({ error: `Python error: ${err}` });
    try {
      const result = JSON.parse(out);
      return res.json(result);
    } catch (e) {
      return res.json({ error: `Unexpected output: ${out}` });
    }
  });
});


module.exports = router;
