var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Trajecto' });
});

/* GET about page. */
router.get('/about', function(req, res, next) {
  res.render('about', { title: 'About - Trajecto' });
});

module.exports = router;
