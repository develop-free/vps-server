const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const eventRoutes = require('./routes/eventRoutes');
const teachersRoutes = require('./routes/teachersRoutes');
const { createUploadsFolder } = require('./utils/fileUtils');
const studentsRoutes = require('./routes/student');
const awardRoutes = require('./routes/AwardRoutes');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 5000;

// Настройки CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Убедитесь, что это соответствует URL вашего фронтенда
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Создание папки для загрузок
createUploadsFolder();

app.use('/awards', express.static(path.join(__dirname, 'awards')));
// Подключение к MongoDB
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error('URI MongoDB не определен в переменных окружения.');
  process.exit(1); // Завершите процесс, если URI не определен
}

mongoose.connect(mongoURI)
  .then(() => console.log('Подключение к MongoDB успешно'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Маршруты
app.use('/api/auth', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', teachersRoutes);
app.use('/api', studentsRoutes);
app.use('/api', awardRoutes);


app.set('etag', false);
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use('/Uploads', express.static(path.join(__dirname, 'Uploads'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache');
  },
}));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

