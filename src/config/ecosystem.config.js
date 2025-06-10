module.exports = {
  apps: [{
    name: 'server',
    script: './src/server.js', // Укажите ваш основной файл
    env: {
      MONGO_URI: 'mongodb+srv://admin:admin@cluster0.sfjy9.mongodb.net/SITES?retryWrites=true&w=majority&appName=Cluster0',
      EMAIL_USER: 'CyberCats.kpk@gmail.com',
      EMAIL_APP_PASS: 'udjztryefbiwyxs'
    }
  }]
};