module.exports = {
  apps: [{
    name: 'server',
    script: '../server.js', // Укажите ваш основной файл
    env: {
      mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/SITES',
      EMAIL_USER: 'CyberCats.kpk@gmail.com',
      EMAIL_APP_PASS: 'udjztryefbiwyxs'
    }
  }]
};