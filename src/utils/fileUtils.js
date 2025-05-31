const fs = require('fs');
const path = require('path');

const createUploadsFolder = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Папка для загрузок создана');
  }
};

module.exports = { createUploadsFolder };
