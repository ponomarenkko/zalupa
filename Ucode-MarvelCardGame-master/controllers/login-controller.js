"use strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { TOKEN_EXPIRE_SEC, TOKEN_SECRET } from "../const.js";

const User = db.sequelize.models.user;
const TYPE_SUCCESS = 'success';
const TYPE_ERROR = 'error';

function generateAccessToken(payload) {
    return jwt.sign(payload, TOKEN_SECRET, { expiresIn: TOKEN_EXPIRE_SEC, });
}

async function checkErrors(data, user) {
    let res = {};

    if (!(user && bcrypt.compareSync(data.password, user.password))) {
        res.type = TYPE_ERROR;
        res.text = 'Login or password is invalid';
        return res;
    }

    res.type = TYPE_SUCCESS;
    res.text = '';
    // res.text = 'You are successfully logged!';

    return res; 
}

async function login(req, res) {
    const data = req.body;

    let user = await User.findOne({
        where: {
            login: data.login
        }
    }).catch(err => console.log(err));

    let result = await checkErrors(data, user);
    
    if (result.type === TYPE_SUCCESS) {
        const token = generateAccessToken({id: user.id, nickname: user.nickname });
        res.cookie('token', token, {sameSite: 'Lax', maxAge: TOKEN_EXPIRE_SEC * 1000,}); //default sameSite: 'None', secure: true
        result.redirect = `/?id=${user.id}`;
    }

    res.json(result);
}

export default login;