//libraries and frameworks
const serverless = require('serverless-http');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

//routers
const usersRoute = require('./routes/Users');
const agendaRoute = require('./routes/agenda');
const paytrackerRoute = require('./routes/paytracker');
const userPageRoute = require('./routes/user');
const lessonsRoute = require('./routes/lessons');
const navbarRoute = require('./routes/navbar');

//middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

app.use('/users', usersRoute);
app.use('/agenda', agendaRoute);
app.use('/paytracker', paytrackerRoute);
app.use('/user', userPageRoute);
app.use('/lessons', lessonsRoute);
app.use('/navbar', navbarRoute);

module.exports.handler = serverless(app);
