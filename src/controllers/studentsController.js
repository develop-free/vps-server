const mongoose = require('mongoose');
const Student = mongoose.model('Student');
const User = mongoose.model('User');
const Department = mongoose.model('Department');
const Group = mongoose.model('Group');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Проверка переменных окружения
if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASS) {
  throw new Error('Отсутствуют учетные данные для отправки email (EMAIL_USER или EMAIL_APP_PASS)');
}

// Настройка Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASS,
  },
});

// Генерация случайного логина
const generateLogin = () => {
  const randomString = crypto.randomBytes(3).toString('hex');
  return `student_${randomString}`;
};

// Генерация случайного пароля
const generatePassword = () => {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
};

// Отправка учетных данных на email студента
const sendStudentCredentials = async (email, login, password) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Ваши учетные данные для входа',
    text: `Ваш логин: ${login}\nВаш пароль: ${password}\nПожалуйста, измените пароль после первого входа.`,
  };
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(`Ошибка отправки email на ${email}:`, error);
    return false;
  }
};

// Отправка уведомления администратору о добавлении студента
const sendAdminNotification = async (studentData) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Новый студент добавлен',
    text: `Добавлен новый студент:\nФИО: ${studentData.last_name} ${studentData.first_name} ${studentData.middle_name || ''}\nОтделение: ${studentData.department_id}\nГруппа: ${studentData.group_id}\nEmail: ${studentData.email}`,
  };
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Ошибка отправки уведомления администратору:', error);
    return false;
  }
};

// Получение всех студентов
const fetchStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'email role')
      .populate('department_id', 'name')
      .populate('group_id', 'name');
    const formattedStudents = students.map(student => ({
      _id: student._id,
      last_name: student.last_name,
      first_name: student.first_name,
      middle_name: student.middle_name,
      department_id: student.department_id._id,
      department_name: student.department_id.name,
      group_id: student.group_id._id,
      group_name: student.group_id.name,
      email: student.user.email,
      is_student: true, // Все записи в таблице students являются студентами
    }));
    res.json(formattedStudents);
  } catch (error) {
    console.error('Ошибка в fetchStudents:', error);
    res.status(500).json({ error: 'Ошибка получения студентов: ' + error.message });
  }
};

// Создание студента
const createStudent = async (req, res) => {
  try {
    const { last_name, first_name, middle_name, department_id, group_id, email, is_student } = req.body;

    // Валидация
    if (!last_name || !first_name || !department_id || !group_id || !email) {
      throw new Error('Заполните все обязательные поля');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Некорректный формат email');
    }

    // Проверка существования отделения и группы
    const department = await Department.findById(department_id);
    if (!department) {
      throw new Error('Отделение не найдено');
    }
    const group = await Group.findById(group_id);
    if (!group || group.department_id.toString() !== department_id) {
      throw new Error('Группа не найдена или не соответствует отделению');
    }

    // Проверка, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Генерация логина и пароля
    const login = generateLogin();
    const password = generatePassword();

    // Создание пользователя с ролью user
    const user = new User({
      login,
      email,
      password: await bcrypt.hash(password, 8),
      role: 'user',
    });
    await user.save();

    // Создание студента
    const student = new Student({
      user: user._id,
      last_name,
      first_name,
      middle_name,
      department_id,
      group_id,
      birth_date: new Date(),
      admission_year: new Date().getFullYear(),
    });
    await student.save();

    // Асинхронная отправка писем
    setImmediate(async () => {
      await Promise.all([
        sendStudentCredentials(email, login, password),
        sendAdminNotification({ last_name, first_name, middle_name, department_id, group_id, email }),
      ]);
    });

    res.status(201).json({
      _id: student._id,
      last_name,
      first_name,
      middle_name,
      department_id,
      department_name: department.name,
      group_id,
      group_name: group.name,
      email,
      is_student: true,
    });
  } catch (error) {
    console.error('Ошибка в createStudent:', error);
    res.status(400).json({ error: error.message });
  }
};

// Обновление студента
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { last_name, first_name, middle_name, department_id, group_id, email, is_student } = req.body;

    // Валидация
    if (!last_name || !first_name || !department_id || !group_id || !email) {
      throw new Error('Заполните все обязательные поля');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Некорректный формат email');
    }

    // Проверка существования студента
    const student = await Student.findById(id);
    if (!student) {
      throw new Error('Студент не найден');
    }

    // Проверка существования отделения и группы
    const department = await Department.findById(department_id);
    if (!department) {
      throw new Error('Отделение не найдено');
    }
    const group = await Group.findById(group_id);
    if (!group || group.department_id.toString() !== department_id) {
      throw new Error('Группа не найдена или не соответствует отделению');
    }

    // Проверка, существует ли другой пользователь с таким email
    const user = await User.findById(student.user);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        throw new Error('Пользователь с таким email уже существует');
      }
    }

    // Обновление студента
    student.last_name = last_name;
    student.first_name = first_name;
    student.middle_name = middle_name;
    student.department_id = department_id;
    student.group_id = group_id;
    await student.save();

    // Обновление пользователя с ролью user
    user.email = email;
    user.role = 'user';
    await user.save();

    res.json({
      _id: student._id,
      last_name,
      first_name,
      middle_name,
      department_id,
      department_name: department.name,
      group_id,
      group_name: group.name,
      email,
      is_student: true,
    });
  } catch (error) {
    console.error('Ошибка в updateStudent:', error);
    res.status(400).json({ error: error.message });
  }
};

// Удаление студента
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      throw new Error('Студент не найден');
    }

    // Удаление пользователя
    await User.findByIdAndDelete(student.user);
    // Удаление студента
    await Student.findByIdAndDelete(id);

    res.status(204).send();
  } catch (error) {
    console.error('Ошибка в deleteStudent:', error);
    res.status(400).json({ error: error.message });
  }
};

// Получение всех отделений
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().select('name');
    res.json(departments);
  } catch (error) {
    console.error('Ошибка в getDepartments:', error);
    res.status(500).json({ error: 'Ошибка получения отделений: ' + error.message });
  }
};

// Получение групп по department_id
const getGroups = async (req, res) => {
  try {
    const { department_id } = req.query;
    if (!department_id) {
      throw new Error('Не указан идентификатор отделения');
    }
    const groups = await Group.find({ department_id }).select('name');
    res.json(groups);
  } catch (error) {
    console.error('Ошибка в getGroups:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getDepartments,
  getGroups,
};