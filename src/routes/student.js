const express = require('express');
const router = express.Router();
const {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getDepartments,
  getGroups,
} = require('../controllers/studentsController');

router.get('/students', fetchStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.get('/departments', getDepartments);
router.get('/groups', getGroups);

module.exports = router;