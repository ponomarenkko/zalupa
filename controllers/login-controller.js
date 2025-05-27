import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import fs from "fs";
import path from "path";
import { TOKEN_EXPIRE_SEC, TOKEN_SECRET } from "../const.js";

const UserModel = db.sequelize.models.user;
const RESPONSE_SUCCESS = 'success';
const RESPONSE_ERROR = 'error';

/**
 * Creates a signed JWT access token.
 * @param {Object} payload - Data to embed in the token.
 * @returns {string} - Signed JWT token.
 */
function createToken(payload) {
    return jwt.sign(payload, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE_SEC });
}

/**
 * Validates user credentials.
 * @param {Object} input - Request body containing login and password.
 * @param {Object|null} user - Fetched user from database.
 * @returns {Object} - Result with type and message.
 */
async function validateLoginCredentials(input, user) {
    if (!user || !bcrypt.compareSync(input.password, user.password)) {
        return { type: RESPONSE_ERROR, text: "Invalid login or password." };
    }
    return { type: RESPONSE_SUCCESS, text: "" };
}

/**
 * Controller for handling login.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function login(req, res) {
    const credentials = req.body;
    let user;
    try {
        user = await UserModel.findOne({ where: { login: credentials.login } });
    } catch (err) {
        console.error("Database error:", err);
    }

    const validation = await validateLoginCredentials(credentials, user);

    if (validation.type === RESPONSE_SUCCESS) {
        const tokenPayload = { id: user.id, nickname: user.nickname };
        const token = createToken(tokenPayload);

        res.cookie("token", token, {
            sameSite: "Lax",
            maxAge: TOKEN_EXPIRE_SEC * 1000,
        });

        validation.redirect = `/?id=${user.id}`;
    }

    res.json(validation);
}

/**
 * Checks if a given login is already taken.
 * @param {string} login - The login to check.
 * @returns {Promise<string>} - Error message or empty string.
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
 * Checks if a given nickname is already taken.
 * @param {string} nickname - The nickname to check.
 * @returns {Promise<string>} - Error message or empty string.
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
 * Validates uniqueness of login and nickname.
 * @param {Object} userData - Object containing login and nickname.
 * @returns {Promise<Object>} - Validation result.
 */
async function validateUserUniqueness({ login, nickname }) {
    const loginMsg = await isLoginTaken(login);
    const nicknameMsg = await isNicknameTaken(nickname);

    if (loginMsg || nicknameMsg) {
        return {
            type: RESPONSE_ERROR,
            text: loginMsg || nicknameMsg,
        };
    }
    return { type: RESPONSE_SUCCESS, text: 'Validation successful' };
}

/**
 * Controller for handling user registration.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function registerUser(req, res) {
    const userData = req.body;
    const validation = await validateUserUniqueness(userData);

    if (validation.type === RESPONSE_SUCCESS) {
        try {
            const hashedPassword = bcrypt.hashSync(userData.password, 10);
            await UserModel.create({
                login: userData.login,
                password: hashedPassword,
                nickname: userData.nickname,
            });
            validation.text = 'User registered successfully';
        } catch (error) {
            console.error(error);
            return res.json({
                type: RESPONSE_ERROR,
                text: 'Failed to create user',
            });
        }
    }

    res.json(validation);
}

/**
 * Controller for handling avatar upload.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function uploadController(req, res) {
    if (!req.file) {
        return res.json({ type: RESPONSE_ERROR, text: "Please select a file to upload." });
    }

    try {
        const userData = jwt.verify(req.cookies.token, TOKEN_SECRET);
        const uploadedFilePath = path.resolve("public/uploads", req.file.filename);
        const avatarData = fs.readFileSync(uploadedFilePath);

        await UserModel.update(
            { avatar: avatarData },
            { where: { id: userData.id } }
        );

        fs.rmSync(uploadedFilePath);
        res.json({ type: RESPONSE_SUCCESS, text: "Avatar updated successfully." });
    } catch (error) {
        res.json({ type: RESPONSE_ERROR, text: error.message || "An error occurred." });
    }
}

/**
 * Controller for handling logout.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export function logout(req, res) {
    res.cookie("token", "", { maxAge: -1 });
    res.redirect("/login");
}
