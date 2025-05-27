import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import multer from "multer";

const TOKEN_SECRET = 'secret';

export function authenticateToken(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(300).redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, TOKEN_SECRET);
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    
    next();
}

export function checkIfLoggedIn(req, res, next) {

    const token = req.cookies.token;

    if (!token) {
        return next();
    }

    const decoded = jwt.verify(token, TOKEN_SECRET);
    res.redirect(`/?id=${decoded.id}`);

}

const imgFilter = (req, file, callback) => {

    if (file.mimetype.startsWith("image")) {
        callback(null, true);
    } else {
        callback("Please upload files in an image format", false);
    }

}

const storage = multer.diskStorage({

    destination: (req, file, callback) => {
        const dirPath = path.resolve("public/uploads");
        if (!fs.existsSync(dirPath)){
            fs.mkdirSync(dirPath);
        }
        callback(null, dirPath);
    },
    filename: (req, file, callback) => {
        callback(null, `${Date.now()}-userfile-${file.originalname}`);
    }
});

function fileUpload(req, res, next) {

    const upload = multer({ storage: storage, fileFilter: imgFilter })
        .single("avatar");
    
    upload(req, res, function (err) {

        if (err) {
            return res.json({ text: err, type: "error" });
        }
        next();

    });

}

export default fileUpload;
