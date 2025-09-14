const express = require("express");
const router = express.Router();

console.log("exam router");
router.post('/run1', (req, res) => {
  res.status(200).json({ message: 'hello-world!' });
});

module.exports = router;