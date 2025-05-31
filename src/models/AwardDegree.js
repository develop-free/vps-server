const mongoose = require('mongoose');

const AwardDegreeSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  awardType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AwardType',
    required: [true, 'Тип награды обязателен'],
  },
});

module.exports = mongoose.model('AwardDegree', AwardDegreeSchema);