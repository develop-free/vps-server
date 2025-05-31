const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateTokens = (user) => {
  try {
    const payload = { id: user._id, role: user.role };
    
    const accessToken = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiration || '1h' }
    );
    
    const refreshToken = jwt.sign(
      payload,
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiration || '15d' }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Ошибка генерации токенов:', error);
    throw new Error('Не удалось сгенерировать токены');
  }
};

const verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;
    
    if (expiresIn < 60 * 5) {
      decoded.isAboutToExpire = true;
    }
    
    return decoded;
  } catch (error) {
    console.error('Ошибка верификации токена:', error);
    throw new Error('Недействительный токен');
  }
};

module.exports = { generateTokens, verifyToken };