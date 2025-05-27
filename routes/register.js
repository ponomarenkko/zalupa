import express from "express";
import path from "path";
import { registerUser } from "../controllers/login-controller.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.render(path.resolve("public", "views", "register.pug"));
});

router.post("/", registerUser);

export default router;
