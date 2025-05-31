const mongoose = require('mongoose');

const AwardSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  eventName: {
    type: String,
    required: true,
    trim: true,
  },
  awardType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AwardType',
    required: true,
  },
  awardDegree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AwardDegree',
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level',
    required: true,
  },
  filePath: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model('Award', AwardSchema);