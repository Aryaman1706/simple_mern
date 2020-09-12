const express = require('express');
const morgan = require('morgan');

//const route_1 = require('./routes/route_1');
//const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
// load static files like html,img, css from puclic folder
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('your-url/route_1', route_1);
app.use('your-url/users', userRouter);

module.exports = app;
