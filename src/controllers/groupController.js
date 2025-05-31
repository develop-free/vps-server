const Group = require('../models/Group');

async function getGroupsByDepartment(req, res) {
  try {
    const { departmentId } = req.params;
    if (!departmentId) {
      return res.status(400).json({ message: 'Не указано отделение' });
    }
    const groups = await Group.find({ department: departmentId });
    res.json(groups);
  } catch (err) {
    res.status(500).json({
      message: 'Ошибка загрузки групп',
      error: err.message
    });
  }
}

module.exports = {
  getGroupsByDepartment
};
