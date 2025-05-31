const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { generateTokens } = require('../utils/jwt');

exports.register = async (req, res) => {
  try {
    const { login, email, password } = req.body;

    if (!login || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Все поля (логин, email, пароль) обязательны'
      });
    }

    if (await User.findOne({ $or: [{ email }, { login }] })) {
      return res.status(400).json({
        success: false,
        message: 'Email или логин уже используется'
      });
    }

    const user = await User.create({
      login,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'user',
      refreshToken: null,
    });

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(201).json({
      success: true,
      accessToken,
      login: user.login,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации: ' + error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Логин и пароль обязательны'
      });
    }

    const user = await User.findOne({
      $or: [{ email: login }, { login }]
    }).select('+password +refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный пароль'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      accessToken,
      login: user.login,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка авторизации: ' + error.message
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Требуется refresh token'
      });
    }

    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный refresh token'
      });
    }

    try {
      jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
      user.refreshToken = null;
      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Недействительный refresh token'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      maxAge: 15 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления токена: ' + error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const user = await User.findById(req.user.id);
    if (user && refreshToken) {
      user.refreshToken = null;
      await user.save();
    }
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Выход выполнен'
    });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка выхода: ' + error.message
    });
  }
};

exports.logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Выход из всех сессий выполнен'
    });
  } catch (error) {
    console.error('Ошибка выхода из всех сессий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка выхода из всех сессий: ' + error.message
    });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        login: req.user.login,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Ошибка проверки авторизации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки авторизации: ' + error.message
    });
  }
};