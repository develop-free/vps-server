const Department = require('../models/Department');

async function getAllDepartments(req, res) {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({
      message: 'Ошибка загрузки отделений',
      error: err.message
    });
  }
}

module.exports = {
  getAllDepartments
};
