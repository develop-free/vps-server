const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  iconType: { type: String, required: true },
  title: { type: String, required: true },
  dateTime: { type: Date, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: false },
  level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: false }
});

module.exports = mongoose.model('Event', EventSchema);