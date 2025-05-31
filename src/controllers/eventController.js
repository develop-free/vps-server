const mongoose = require('mongoose');
const Event = require('../models/Event');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Level = require('../models/Level');

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('students', 'first_name last_name')
      .populate('teacher', 'first_name last_name')
      .populate('level', 'levelName');
    res.json(events);
  } catch (err) {
    console.error('Error in getAllEvents:', err);
    res.status(500).json({ message: 'Ошибка сервера при получении мероприятий' });
  }
};

exports.createEvent = async (req, res) => {
  const { iconType, title, dateTime, students = [], teacher, level } = req.body;

  if (!iconType || !title || !dateTime) {
    return res.status(400).json({ message: 'Обязательные поля: iconType, title, dateTime' });
  }

  try {
    // Validate students
    if (students.length > 0) {
      const existingStudents = await Student.countDocuments({ _id: { $in: students } });
      if (existingStudents !== students.length) {
        return res.status(400).json({ message: 'Один или несколько студентов не найдены' });
      }
    }

    // Validate teacher
    let teacherId = null;
    if (teacher && teacher !== '') {
      const teacherExists = await Teacher.exists({ _id: teacher });
      if (!teacherExists) {
        return res.status(400).json({ message: 'Преподаватель не найден' });
      }
      teacherId = teacher;
    }

    // Validate level
    let levelId = null;
    if (level && level !== '') {
      const levelExists = await Level.exists({ _id: level });
      if (!levelExists) {
        return res.status(400).json({ message: 'Уровень не найден' });
      }
      levelId = level;
    }

    const event = new Event({
      iconType,
      title,
      dateTime: new Date(dateTime),
      students,
      teacher: teacherId,
      level: levelId
    });

    const savedEvent = await event.save();
    const populatedEvent = await Event.findById(savedEvent._id)
      .populate('students', 'first_name last_name')
      .populate('teacher', 'first_name last_name')
      .populate('level', 'levelName');

    res.status(201).json(populatedEvent);
  } catch (err) {
    console.error('Error in createEvent:', err);
    res.status(400).json({ message: err.message || 'Ошибка при создании мероприятия' });
  }
};

exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { iconType, title, dateTime, students = [], teacher, level } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Неверный ID мероприятия' });
  }

  if (!iconType || !title || !dateTime) {
    return res.status(400).json({ message: 'Обязательные поля: iconType, title, dateTime' });
  }

  try {
    // Check if event exists
    const eventExists = await Event.exists({ _id: id });
    if (!eventExists) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    // Validate students
    if (students.length > 0) {
      const existingStudents = await Student.countDocuments({ _id: { $in: students } });
      if (existingStudents !== students.length) {
        return res.status(400).json({ message: 'Один или несколько студентов не найдены' });
      }
    }

    // Validate teacher
    let teacherId = null;
    if (teacher && teacher !== '') {
      const teacherExists = await Teacher.exists({ _id: teacher });
      if (!teacherExists) {
        return res.status(400).json({ message: 'Преподаватель не найден' });
      }
      teacherId = teacher;
    }

    // Validate level
    let levelId = null;
    if (level && level !== '') {
      const levelExists = await Level.exists({ _id: level });
      if (!levelExists) {
        return res.status(400).json({ message: 'Уровень не найден' });
      }
      levelId = level;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        iconType,
        title,
        dateTime: new Date(dateTime),
        students,
        teacher: teacherId,
        level: levelId
      },
      { new: true }
    )
      .populate('students', 'first_name last_name')
      .populate('teacher', 'first_name last_name')
      .populate('level', 'levelName');

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    res.json(updatedEvent);
  } catch (err) {
    console.error('Error in updateEvent:', err);
    res.status(400).json({ message: err.message || 'Ошибка при обновлении мероприятия' });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Неверный ID мероприятия' });
  }

  try {
    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }
    res.json({ message: 'Мероприятие удалено' });
  } catch (err) {
    console.error('Error in deleteEvent:', err);
    res.status(500).json({ message: 'Ошибка сервера при удалении мероприятия' });
  }
};