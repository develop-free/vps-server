const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Идентификатор пользователя обязателен'],
    unique: true
  },
  first_name: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true
  },
  last_name: {
    type: String,
    required: [true, 'Фамилия обязательна'],
    trim: true
  },
  middle_name: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Должность обязательна'],
    trim: true
  }
});


module.exports = mongoose.model('Teacher', TeacherSchema);