module.exports = {
  apps: [{
    name: 'server',
    script: '../server.js', // Укажите ваш основной файл
    env: {
      EMAIL_USER: 'CyberCats.kpk@gmail.com',
      EMAIL_APP_PASS: 'udjztryefbiwyxs'
    }
  }]
};