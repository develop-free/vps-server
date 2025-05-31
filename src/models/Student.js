const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Идентификатор пользователя обязателен'],
    unique: true, // Гарантирует один профиль студента на пользователя
  },
  first_name: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true,
    match: [/^[A-Za-zА-Яа-яЁё\s-]+$/, 'Имя должно содержать только буквы, пробелы и дефисы'],
  },
  last_name: {
    type: String,
    required: [true, 'Фамилия обязательна'],
    trim: true,
    match: [/^[A-Za-zА-Яа-яЁё\s-]+$/, 'Фамилия должна содержать только буквы, пробелы и дефисы'],
  },
  middle_name: {
    type: String,
    trim: true,
    match: [/^[A-Za-zА-Яа-яЁё\s-]*$/, 'Отчество должно содержать только буквы, пробелы и дефисы'],
  },
  birth_date: {
    type: Date,
    required: [true, 'Дата рождения обязательна'],
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Отделение обязательно'],
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Группа обязательна'],
  },
  login: {
    type: String,
    required: [true, 'Логин обязателен'],
    trim: true,
    match: [/^[A-Za-z0-9_-]{3,50}$/, 'Логин должен содержать 3-50 символов (буквы, цифры, _, -)'],
  },
  email: {
    type: String,
    required: [true, 'Электронная почта обязательна'],
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Некорректный формат электронной почты'],
  },
  admission_year: {
    type: Number,
    required: [true, 'Год поступления обязателен'],
    min: [2000, 'Год поступления не может быть раньше 2000'],
    max: [new Date().getFullYear(), 'Год поступления не может быть в будущем'],
  },
  avatar: {
    type: String,
    default: null,
  },
});


module.exports = mongoose.model('Student', studentSchema);