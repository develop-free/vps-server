const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Level = require('../models/Level');

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().select('first_name last_name');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().select('first_name last_name');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.find().select('levelName');
    res.json(levels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};