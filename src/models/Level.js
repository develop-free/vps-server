const mongoose = require('mongoose');

const LevelSchema = new mongoose.Schema({
  levelName: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model('Level', LevelSchema);