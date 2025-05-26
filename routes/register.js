import express from "express";
import path from "path";
import register from "../controllers/register-controller.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.render(path.resolve('public', 'views', 'register.pug'))
});

router.post('/', register);

export default router;