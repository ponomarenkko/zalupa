import fs from "fs";
import path from "path";
import db from "../models/index.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../const.js";

const User = db.sequelize.models.user;

async function uploadController (req, res) {

    if (req.file === undefined) {
        return res.json({ text: "Choose a file to upload.", type: "error" });
    }
    const decoded = jwt.verify(req.cookies.token, TOKEN_SECRET);

    const filePath = path.resolve("public/uploads", req.file.filename);

    User.update(
        { avatar: fs.readFileSync(filePath) },
        { where: { id: decoded.id } }
    )
        .then(() => {
            
            fs.rmSync(filePath);
            res.json({ text: "Avatar changed successfully.", type: "success" })
            
        })
        .catch(err => res.json({ text: err, type: "error" }));

}

export default uploadController;
