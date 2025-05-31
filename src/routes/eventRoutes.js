const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const dataController = require('../controllers/dataController');

// Маршруты для мероприятий
router.get('/', eventController.getAllEvents);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// Маршруты для справочных данных
router.get('/students', dataController.getStudents);
router.get('/teachers', dataController.getTeachers);
router.get('/levels', dataController.getLevels);

module.exports = router;