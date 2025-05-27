import express from "express";
import fileUpload from "../auth/auth_file_upload.js";
import { uploadController } from "../controllers/controllers.js";

const router = express.Router();

router.post("/", fileUpload, uploadController);

export default router;
