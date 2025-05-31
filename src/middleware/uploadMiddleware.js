// uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../Uploads');
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Папка Uploads создана или существует:', uploadPath);
      cb(null, uploadPath);
    } catch (err) {
      console.error('Ошибка создания папки Uploads:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    console.log('Генерация имени файла:', { filename: `${uniqueSuffix}${ext}` });
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла. Допускаются только JPEG, PNG или GIF.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;