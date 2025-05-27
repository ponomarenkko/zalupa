import jwt from "jsonwebtoken";
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
