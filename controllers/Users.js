const { getUsers } = require('../service/UsersPage');

const getAllUsers = async (req, res) => {
  const users = await getUsers(); //these smaller functions used to build big manipulation to data

  return res.status(200).json(users);
};

module.exports = {
  getAllUsers,
};
