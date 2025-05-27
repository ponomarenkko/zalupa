import fs from "fs";
import path from "path";
import db from "../models/index.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../const.js";

const UserModel = db.sequelize.models.user;

/**
 * Controller to handle avatar upload and update for the logged-in user.
 * @param {Object} req - Express request object, expects file info and cookies.
 * @param {Object} res - Express response object for sending back results.
 */
async function uploadController(req, res) {
  // Check if a file was provided in the request
  if (!req.file) {
    return res.json({ type: "error", text: "Please select a file to upload." });
  }

  try {
    // Verify and decode JWT token from cookies to get user info
    const userData = jwt.verify(req.cookies.token, TOKEN_SECRET);

    // Construct absolute path to the uploaded file
    const uploadedFilePath = path.resolve("public/uploads", req.file.filename);

    // Read the file content to store in the database
    const avatarData = fs.readFileSync(uploadedFilePath);

    // Update the user's avatar in the database
    await UserModel.update(
      { avatar: avatarData },
      { where: { id: userData.id } }
    );

    // Remove the temporary file from the server after successful update
    fs.rmSync(uploadedFilePath);

    // Respond with success message
    res.json({ type: "success", text: "Avatar updated successfully." });
  } catch (error) {
    // Handle errors such as token verification or database issues
    res.json({ type: "error", text: error.message || "An error occurred." });
  }
}

export default uploadController;
