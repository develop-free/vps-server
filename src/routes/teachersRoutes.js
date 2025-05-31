const express = require('express');
const router = express.Router();
const {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teachersController');

router.get('/teachers', fetchTeachers);
router.post('/teachers', createTeacher);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);

module.exports = router;