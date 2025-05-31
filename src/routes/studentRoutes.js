const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile', authMiddleware.authenticate, studentController.getProfile);
router.post('/profile',authMiddleware.authenticate,upload.single('avatar'),studentController.createProfile);
router.put('/profile',authMiddleware.authenticate,upload.single('avatar'),studentController.updateProfile);
router.patch('/profile/avatar',authMiddleware.authenticate,upload.single('avatar'),studentController.updateAvatar);

router.get('/departments/all',authMiddleware.authenticate,studentController.getDepartments);
router.get('/groups',authMiddleware.authenticate,studentController.getGroupsByDepartment);

module.exports = router;