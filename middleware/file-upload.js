import fs from "fs";
import path from "path";
import multer from "multer";

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
