const express = require('express');
const router = express.Router();
const awardController = require('../controllers/AwardController');


router.get('/awards/students', awardController.getStudents);
router.get('/awards/departments', awardController.getDepartments);
router.get('/awards/groups/:departmentId', awardController.getGroups);
router.get('/awards/types', awardController.getAwardTypes);
router.get('/awards/degrees', awardController.getAwardDegrees);
router.get('/awards/levels', awardController.getLevels);
router.get('/awards/events', awardController.getEvents);
router.get('/awards/student/:studentId', awardController.getAwardsByStudent);
router.post('/awards', awardController.createAward);
router.get('/awards/user/:userId/studentId', awardController.getStudentIdByUser); // Новый маршрут

module.exports = router;