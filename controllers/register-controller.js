"use strict";
import bcrypt from "bcrypt";
import db from "../models/index.js";

const UserModel = db.sequelize.models.user;
const RESPONSE_SUCCESS = 'success';
const RESPONSE_ERROR = 'error';

/**
 * Check if a login already exists in the database.
 * @param {string} login - The login to check.
 * @returns {Promise<string>} - Error message if login exists, empty string otherwise.
 */
async function isLoginTaken(login) {
  try {
    const user = await UserModel.findOne({ where: { login } });
    return user ? 'This login is already taken' : '';
  } catch (error) {
    console.error(error);
    return 'Error checking login';
  }
}

/**
 * Check if a nickname already exists in the database.
 * @param {string} nickname - The nickname to check.
 * @returns {Promise<string>} - Error message if nickname exists, empty string otherwise.
 */
async function isNicknameTaken(nickname) {
  try {
    const user = await UserModel.findOne({ where: { nickname } });
    return user ? 'This nickname is already in use' : '';
  } catch (error) {
    console.error(error);
    return 'Error checking nickname';
  }
}

/**
 * Validates that both login and nickname are unique.
 * @param {Object} userData - Object containing login and nickname.
 * @returns {Promise<Object>} - Result object with type and message.
 */
async function validateUserUniqueness({ login, nickname }) {
  const loginMsg = await isLoginTaken(login);
  const nicknameMsg = await isNicknameTaken(nickname);

  if (loginMsg || nicknameMsg) {
    return {
      type: RESPONSE_ERROR,
      text: loginMsg || nicknameMsg
    };
  }

  return {
    type: RESPONSE_SUCCESS,
    text: 'Registration successful!'
  };
}

/**
 * Handles user registration: checks uniqueness, hashes password, and creates user.
 * @param {Object} req - Express request object, expects user data in req.body.
 * @param {Object} res - Express response object, used to send JSON response.
 */
async function registerUser(req, res) {
  const userData = req.body;

  // Validate if login and nickname are unique
  const validation = await validateUserUniqueness(userData);

  if (validation.type === RESPONSE_SUCCESS) {
    try {
      // Hash the password before storing
      const hashedPassword = bcrypt.hashSync(userData.password, 10);

      // Create new user record in the database
      await UserModel.create({
        nickname: userData.nickname,
        login: userData.login,
        password: hashedPassword
      });
    } catch (error) {
      console.error(error);
      // Return error response if user creation fails
      return res.json({
        type: RESPONSE_ERROR,
        text: 'Failed to create user'
      });
    }
  }

  // Send success or error response back to client
  res.json(validation);
}

export default registerUser;
