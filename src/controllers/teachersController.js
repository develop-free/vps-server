const mongoose = require('mongoose');
const Teacher = mongoose.model('Teacher');
const User = mongoose.model('User');
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

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_APP_PASS:', process.env.EMAIL_APP_PASS);

// Генерация случайного логина
const generateLogin = () => {
  const randomString = crypto.randomBytes(3).toString('hex');
  return `teacher_${randomString}`;
};

// Генерация случайного пароля
const generatePassword = () => {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
};

// Отправка учетных данных на email преподавателя
const sendTeacherCredentials = async (email, login, password) => {
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

// Отправка уведомления администратору о добавлении преподавателя
const sendAdminNotification = async (teacherData) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Новый преподаватель добавлен',
    text: `Добавлен новый преподаватель:\nФИО: ${teacherData.last_name} ${teacherData.first_name} ${teacherData.middle_name || ''}\nДолжность: ${teacherData.position}\nEmail: ${teacherData.email}`,
  };
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Ошибка отправки уведомления администратору:', error);
    return false;
  }
};

// Получение всех преподавателей
const fetchTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().populate('user', 'email role');
    const formattedTeachers = teachers.map(teacher => ({
      _id: teacher._id,
      last_name: teacher.last_name,
      first_name: teacher.first_name,
      middle_name: teacher.middle_name,
      position: teacher.position,
      email: teacher.user.email,
      is_teacher: teacher.user.role === 'teacher',
    }));
    res.json(formattedTeachers);
  } catch (error) {
    console.error('Ошибка в fetchTeachers:', error);
    res.status(500).json({ error: 'Ошибка получения преподавателей: ' + error.message });
  }
};

// Создание преподавателя
const createTeacher = async (req, res) => {
  try {
    const { last_name, first_name, middle_name, position, email, is_teacher } = req.body;

    // Валидация
    if (!last_name || !first_name || !position || !email) {
      throw new Error('Заполните все обязательные поля');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Некорректный формат email');
    }

    // Проверка, существует ли пользователь с таким email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Генерация логина и пароля
    const login = generateLogin();
    const password = generatePassword();

    // Создание пользователя
    const user = new User({
      login,
      email,
      password: await bcrypt.hash(password, 8), // Уменьшено до 8 раундов
      role: is_teacher ? 'teacher' : 'user',
    });
    await user.save();

    // Создание преподавателя
    const teacher = new Teacher({
      user: user._id,
      last_name,
      first_name,
      middle_name,
      position,
    });
    await teacher.save();

    // Асинхронная отправка писем
    setImmediate(async () => {
      await Promise.all([
        sendTeacherCredentials(email, login, password),
        sendAdminNotification({ last_name, first_name, middle_name, position, email }),
      ]);
    });

    res.status(201).json({
      _id: teacher._id,
      last_name,
      first_name,
      middle_name,
      position,
      email,
      is_teacher,
    });
  } catch (error) {
    console.error('Ошибка в createTeacher:', error);
    res.status(400).json({ error: error.message });
  }
};

// Обновление преподавателя
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { last_name, first_name, middle_name, position, email, is_teacher } = req.body;

    // Валидация
    if (!last_name || !first_name || !position || !email) {
      throw new Error('Заполните все обязательные поля');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Некорректный формат email');
    }

    // Проверка, существует ли другой пользователь с таким email
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Обновление преподавателя
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      throw new Error('Преподаватель не найден');
    }

    teacher.last_name = last_name;
    teacher.first_name = first_name;
    teacher.middle_name = middle_name;
    teacher.position = position;
    await teacher.save();

    // Обновление пользователя
    const user = await User.findById(teacher.user);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    user.email = email;
    user.role = is_teacher ? 'teacher' : 'user';
    await user.save();

    res.json({
      _id: teacher._id,
      last_name,
      first_name,
      middle_name,
      position,
      email,
      is_teacher,
    });
  } catch (error) {
    console.error('Ошибка в updateTeacher:', error);
    res.status(400).json({ error: error.message });
  }
};

// Удаление преподавателя
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      throw new Error('Преподаватель не найден');
    }

    // Удаление пользователя
    await User.findByIdAndDelete(teacher.user);
    // Удаление преподавателя
    await Teacher.findByIdAndDelete(id);

    res.status(204).send();
  } catch (error) {
    console.error('Ошибка в deleteTeacher:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  fetchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};