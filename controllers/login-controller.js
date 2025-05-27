"use strict";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { TOKEN_EXPIRE_SEC, TOKEN_SECRET } from "../const.js";

const User = db.sequelize.models.user;

// Response types for clarity
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
async function validateLogin(input, user) {
    const result = {};

    const isPasswordValid = user && bcrypt.compareSync(input.password, user.password);

    if (!isPasswordValid) {
        result.type = RESPONSE_ERROR;
        result.text = "Invalid login or password.";
        return result;
    }

    result.type = RESPONSE_SUCCESS;
    result.text = "";  // Optional success message
    return result;
}

/**
 * Handles login request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
async function handleLogin(req, res) {
    const credentials = req.body;

    let user;
    try {
        user = await User.findOne({ where: { login: credentials.login } });
    } catch (err) {
        console.error("Database error:", err);
    }

    const validation = await validateLogin(credentials, user);

    if (validation.type === RESPONSE_SUCCESS) {
        const tokenPayload = { id: user.id, nickname: user.nickname };
        const token = createToken(tokenPayload);

        res.cookie("token", token, {
            sameSite: "Lax",
            maxAge: TOKEN_EXPIRE_SEC * 1000, // Convert seconds to milliseconds
        });

        validation.redirect = `/?id=${user.id}`;
    }

    res.json(validation);
}

export default handleLogin;
