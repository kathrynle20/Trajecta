var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const cors = require('cors');

require('dotenv').config({ path: '../frontend/.env' });

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
<<<<<<< HEAD
var feedApiRouter = require('./routes/feed-api');
var profileRouter = require('./routes/profile');
var feedApiRouter = require('./routes/feed-api');
var profileRouter = require('./routes/profile');
var feedApiRouter = require('./routes/feed-api');
=======
var profileRouter = require('./routes/profile');
>>>>>>> d87e56c (adding experiences)

// Import passport configuration
require('./config/passport');

var app = express();

// CORS configuration
app.use(cors({
  origin: true, // Allow requests from your React app
  credentials: true // Allow cookies/sessions to be sent
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, '../public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
<<<<<<< HEAD
app.use('/feed-api', feedApiRouter);
app.use('/profile', profileRouter);
app.use('/feed-api', feedApiRouter);
app.use('/profile', profileRouter);
app.use('/feed-api', feedApiRouter);
=======
app.use('/profile', profileRouter);
>>>>>>> d87e56c (adding experiences)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
