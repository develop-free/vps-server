const Award = require('../models/Award');
const AwardType = require('../models/AwardType');
const AwardDegree = require('../models/AwardDegree');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Group = require('../models/Group');
const Level = require('../models/Level');
const Event = require('../models/Event');
const User = require('../models/User');
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
const ERROR_MESSAGES = {
  INVALID_ID: (field) => `Недействительный ID ${field}`,
  MISSING_FIELD: (field) => `Поле ${field} обязательно`,
  NOT_FOUND: (entity, id) => `${entity} с ID ${id} не найден`,
  SERVER_ERROR: 'Ошибка сервера',
  INVALID_FILE_TYPE: 'Поддерживаются только файлы JPEG, PNG или PDF',
};

// Создание директории для наград
try {
  if (!fs.existsSync(AWARDS_DIR)) {
    fs.mkdirSync(AWARDS_DIR, { recursive: true });
  }
} catch (error) {
  // Логирование удалено
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
    cb(isValid ? null : new Error(ERROR_MESSAGES.INVALID_FILE_TYPE), isValid);
  },
}).single('filePath');

// Вспомогательная функция для валидации ObjectId
const isValidObjectId = (id, field) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(ERROR_MESSAGES.INVALID_ID(field));
  }
  return id;
};

// Вспомогательная функция для проверки существования документа
const checkExists = async (Model, id, entity) => {
  const doc = await Model.findById(id);
  if (!doc) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND(entity, id));
  }
  return doc;
};

// Централизованная обработка ошибок
const handleError = (res, error, status = STATUS_CODES.SERVER_ERROR) => {
  console.error(error);
  res.status(status).json({ message: ERROR_MESSAGES.SERVER_ERROR, error: error.message });
};

exports.createAward = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: err.message });
    }

    try {
      const { studentId, departmentId, groupId, eventName, awardType, awardDegree, level } = req.body;
      const filePath = req.file ? req.file.path : null;

      // Валидация обязательных полей
      const requiredFields = { studentId, departmentId, groupId, eventName, awardType, level };
      for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({ message: ERROR_MESSAGES.MISSING_FIELD(field) });
        }
      }

      // Проверка валидности ObjectId
      isValidObjectId(studentId, 'студента');
      isValidObjectId(departmentId, 'отделения');
      isValidObjectId(groupId, 'группы');
      isValidObjectId(awardType, 'типа награды');
      if (awardDegree) isValidObjectId(awardDegree, 'степени награды');
      isValidObjectId(level, 'уровня');

      // Проверка существования документов (параллельные запросы)
      await Promise.all([
        checkExists(Student, studentId, 'Студент'),
        checkExists(Department, departmentId, 'Отделение'),
        checkExists(Group, groupId, 'Группа'),
        checkExists(AwardType, awardType, 'Тип награды'),
        checkExists(Level, level, 'Уровень'),
      ]);

      // Проверка степени награды
      if (awardDegree) {
        const awardDegreeDoc = await checkExists(AwardDegree, awardDegree, 'Степень награды');
        const awardtypesId = awardDegreeDoc.awardtypes_id;

        if (!awardtypesId || !mongoose.Types.ObjectId.isValid(awardtypesId)) {
          // Предупреждение удалено
        } else if (awardtypesId.toString() !== awardType) {
          // Предупреждение удалено
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

      res.status(STATUS_CODES.CREATED).json({
        message: 'Награда успешно создана',
        award,
        awards,
      });
    } catch (error) {
      handleError(res, error, error.message.includes('Недействительный') ? STATUS_CODES.BAD_REQUEST : STATUS_CODES.NOT_FOUND);
    }
  });
};

exports.getStudentIdByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    isValidObjectId(userId, 'пользователя');

    const student = await Student.findOne({ user: userId }).select('_id first_name last_name middle_name');
    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'Студент не найден для данного пользователя' });
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
      .populate('studentId', 'first_name last_name middle_name')
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
    if (!awardDegrees.length) {
      return res.status(STATUS_CODES.OK).json([]);
    }
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
    const userId = req.userId; // Извлекается из JWT-токена через middleware
    isValidObjectId(userId, 'пользователя');

    // Находим пользователя
    const user = await User.findById(userId);
    if (!user || !user.studentId) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'Студент не найден для текущего пользователя' });
    }

    const studentId = user.studentId;
    isValidObjectId(studentId, 'студента');

    // Находим студента
    const student = await Student.findById(studentId).select('first_name last_name middle_name');
    if (!student) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: 'Студент не найден' });
    }

    // Находим награды
    const awards = await Award.find({ studentId })
      .populate('studentId', 'first_name last_name middle_name')
      .populate('departmentId', 'name')
      .populate('groupId', 'name')
      .populate('awardType', 'name')
      .populate('awardDegree', 'name')
      .populate('level', 'levelName');

    res.status(STATUS_CODES.OK).json({ student, awards });
  } catch (error) {
    handleError(res, error);
  }
};