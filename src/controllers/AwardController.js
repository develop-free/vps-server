const Award = require('../models/Award');
const AwardType = require('../models/AwardType');
const AwardDegree = require('../models/AwardDegree');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Group = require('../models/Group');
const Level = require('../models/Level');
const Event = require('../models/Event');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Константы
const AWARDS_DIR = path.resolve(__dirname, '..', 'awards');
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// Создание директории для наград
if (!fs.existsSync(AWARDS_DIR)) {
  fs.mkdirSync(AWARDS_DIR, { recursive: true });
}

// Настройка Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AWARDS_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const isValid = filetypes.test(file.mimetype) && filetypes.test(path.extname(file.originalname).toLowerCase());
    cb(isValid ? null : new Error('INVALID_FILE_TYPE'), isValid);
  },
}).single('filePath');

// Вспомогательная функция для валидации ObjectId
const isValidObjectId = (id, field) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('INVALID_ID');
  }
  return id;
};

// Вспомогательная функция для проверки существования документа
const checkExists = async (Model, id) => {
  const doc = await Model.findById(id);
  if (!doc) {
    throw new Error('NOT_FOUND');
  }
  return doc;
};

// Централизованная обработка ошибок
const handleError = (res, error, status = STATUS_CODES.SERVER_ERROR) => {
  console.error(error);
  res.status(status).json({ message: error.message });
};

exports.createAward = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: 'INVALID_FILE_TYPE' });
    }

    try {
      const { studentId, departmentId, groupId, eventName, awardType, awardDegree, level } = req.body;
      const filePath = req.file ? req.file.path : null;

      // Валидация обязательных полей
      const requiredFields = { studentId, departmentId, groupId, eventName, awardType, level };
      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({ message: 'MISSING_FIELD' });
        }
      }

      // Проверка валидности ObjectId
      isValidObjectId(studentId, 'студента');
      isValidObjectId(departmentId, 'отделения');
      isValidObjectId(groupId, 'группы');
      isValidObjectId(awardType, 'типа награды');
      if (awardDegree) isValidObjectId(awardDegree, 'степени награды');
      isValidObjectId(level, 'уровня');

      // Проверка существования документов
      await Promise.all([
        checkExists(Student, studentId),
        checkExists(Department, departmentId),
        checkExists(Group, groupId),
        checkExists(AwardType, awardType),
        checkExists(Level, level),
      ]);

      // Проверка степени награды
      if (awardDegree) {
        const awardDegreeDoc = await checkExists(AwardDegree, awardDegree);
        const awardtypesId = awardDegreeDoc.awardtypes_id;
        if (awardtypesId && mongoose.Types.ObjectId.isValid(awardtypesId) && awardtypesId.toString() !== awardType) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({ message: 'INVALID_AWARD_DEGREE' });
        }
      }

      // Создание награды
      const award = new Award({
        studentId,
        departmentId,
        groupId,
        eventName,
        awardType,
        awardDegree: awardDegree || null,
        level,
        filePath,
      });

      await award.save();

      // Получение обновленного списка наград
      const awards = await Award.find({ studentId })
        .populate('studentId', 'first_name last_name middle_name')
        .populate('departmentId', 'name')
        .populate('groupId', 'name')
        .populate('awardType', 'name')
        .populate('awardDegree', 'name')
        .populate('level', 'levelName');

      res.status(STATUS_CODES.CREATED).json({ awards });
    } catch (error) {
      handleError(res, error, error.message.includes('INVALID') ? STATUS_CODES.BAD_REQUEST : STATUS_CODES.NOT_FOUND);
    }
  });
};

exports.getStudentIdByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    isValidObjectId(userId, 'пользователя');

    const student = await Student.findOne({ user: userId }).select('_id first_name last_name middle_name');
    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'NOT_FOUND' });
    }

    res.status(STATUS_CODES.OK).json({
      studentId: student._id,
      studentName: `${student.last_name} ${student.first_name} ${student.middle_name}`,
    });
  } catch (error) {
    handleError(res, error);
  }
};

exports.getAwardsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    isValidObjectId(studentId, 'студента');

    const awards = await Award.find({ studentId })
      .populate({
        path: 'studentId',
        select: 'first_name last_name middle_name user',
        populate: {
          path: 'user',
          model: 'User',
          select: 'email role',
        },
      })
      .populate('departmentId', 'name')
      .populate('groupId', 'name')
      .populate('awardType', 'name')
      .populate('awardDegree', 'name')
      .populate('level', 'levelName');

    res.status(STATUS_CODES.OK).json(awards);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getAwardTypes = async (req, res) => {
  try {
    const awardTypes = await AwardType.find();
    res.status(STATUS_CODES.OK).json(awardTypes);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getAwardDegrees = async (req, res) => {
  try {
    const awardDegrees = await AwardDegree.find({
      awardtypes_id: { $exists: true, $ne: null, $type: 'objectId' },
    });
    res.status(STATUS_CODES.OK).json(awardDegrees);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getGroups = async (req, res) => {
  try {
    const { departmentId } = req.params;
    isValidObjectId(departmentId, 'отделения');
    const groups = await Group.find({ department_id: departmentId });
    res.status(STATUS_CODES.OK).json(groups);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    const validStudents = students.filter(
      (student) =>
        student &&
        typeof student.last_name === 'string' &&
        typeof student.first_name === 'string' &&
        typeof student.middle_name === 'string'
    );
    res.status(STATUS_CODES.OK).json(validStudents);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(STATUS_CODES.OK).json(departments);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.find();
    res.status(STATUS_CODES.OK).json(levels);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(STATUS_CODES.OK).json(events);
  } catch (error) {
    handleError(res, error);
  }
};

exports.getCurrentStudentAndAwards = async (req, res) => {
  try {
    const userId = req.userId;
    isValidObjectId(userId, 'userId');

    const student = await Student.findOne({ user: userId }).select('_id first_name last_name middle_name');
    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'NOT_FOUND' });
    }

    const studentId = student._id;

    const awards = await Award.find({ studentId })
      .populate({
        path: 'studentId',
        select: 'first_name last_name middle_name user',
        populate: {
          path: 'user',
          select: 'email',
        },
      })
      .populate('departmentId', 'name')
      .populate('groupId', 'name')
      .populate('awardType', 'name')
      .populate('awardDegree', 'name')
      .populate('level', 'levelName');

    res.status(STATUS_CODES.OK).json({
      student: {
        studentId: student._id,
        studentName: `${student.last_name} ${student.first_name} ${student.middle_name}`,
      },
      awards,
    });
  } catch (error) {
    handleError(res, error);
  }
};