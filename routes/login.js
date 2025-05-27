import express from "express";
import path from "path";
import { login } from "../controllers/controllers.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.render(path.resolve("public", "views", "login.pug"));
});

router.post("/", login);

export default router;
