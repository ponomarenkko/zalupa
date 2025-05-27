import express from "express";
import fileUpload from "../middleware/file-upload.js";
import { uploadController } from "../controllers/login-controller.js";

const router = express.Router();

router.post("/", fileUpload, uploadController);

export default router;
