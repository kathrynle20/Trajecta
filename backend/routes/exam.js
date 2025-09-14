const express = require("express");
const router = express.Router();

console.log("exam router");
router.post('/run1', (req, res) => {
  res.json({ message: 'hello-world!' });
});

module.exports = router;