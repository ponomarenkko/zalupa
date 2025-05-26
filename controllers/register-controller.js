"use strict";
import bcrypt from "bcrypt";
import db from "../models/index.js";

const User = db.sequelize.models.user;
const TYPE_SUCCESS = 'success';
const TYPE_ERROR = 'error';

async function checkLogin(newLogin) {
    let res = await User.findOne({
        where: {
            login: newLogin
        }
    }).catch(err => console.log(err));;

    if (res)
        return 'The user with this login already exists';

    return '';
}

async function checkNickname(newNickname) {
    let res = await User.findOne({
        where: {
            nickname: newNickname
        }
    }).catch(err => console.log(err));;

    if (res)
        return 'The user with this nickname already exists';

    return '';
}

async function checkUnique(userData) {
    let loginErrorMsg = await checkLogin(userData.login);
    let nicknameErrorMsg = await checkNickname(userData.nickname);
    let res = {};
    
    if ((res.text = loginErrorMsg || nicknameErrorMsg)) {
        res.type = TYPE_ERROR;
        return res;
    }
    
    res.type = TYPE_SUCCESS;
    res.text = 'You are successfully registered!';
    return res;
}

async function register(req, res) {
    const data = req.body;
    let result = await checkUnique(data);
    
    if (result.type === TYPE_SUCCESS) {
        const hash = bcrypt.hashSync(data.password, 10);
        const user = await User.create({ nickname: data.nickname, login: data.login, password: hash }).catch(err => console.log(err));;
    }
    
    res.json(result);
}

export default register;