const config = require('./databaseConfig');

const mysql = require('serverless-mysql')({
  config: config,
});

module.exports = mysql;
