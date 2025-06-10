require('dotenv').config();

// Используйте одно и то же имя переменной окружения
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/SITES';

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '15d'
  },
  mongoURI: mongoURI // Используйте переменную, определенную выше
};