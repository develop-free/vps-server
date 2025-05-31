const mongoose = require('mongoose');

const AwardTypeSchema = new mongoose.Schema({
  name: {
    type: String,
  },
});

module.exports = mongoose.model('AwardType', AwardTypeSchema);