const mysql = require('../database/database-Connect');

//smaller functions used to retrieve the data
const getUsers = async () => {
  const users = await mysql.query('SELECT * FROM user');
  await mysql.end();
  return users;
};

module.exports = {
  getUsers,
};
