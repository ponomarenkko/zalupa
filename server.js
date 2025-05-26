import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import initialize from "./models/init.js";
import { checkIfLoggedIn, authenticateToken } from "./middleware/auth.js";
import loginRouter from "./routes/login.js";
import registerRouter from "./routes/register.js";
import uploadRouter from "./routes/avatar-upload.js";
import gameRouter from "./routes/game.js";
import logoutRouter from "./routes/logout.js";
import db from "./models/index.js";
import http from 'http';

const app = express();
const port = 3000;
const host = "localhost";
const viewPath = path.join("public", "views");
const isDev = process.env.NODE_ENV !== "test";

const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);
import ioHandler from "./socket.js";
io.on('connection', ioHandler.bind(io));

if (isDev) {
    initialize()
        .catch(err => console.error(err));
}

app.set("view engine", "pug");
app.set("views", path.resolve(viewPath));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

app.use(express.static(path.resolve("public")));

app.get('/', authenticateToken, (req, res) => {
    res.render(path.resolve(viewPath, 'index.pug'));
});

app.use('/login', checkIfLoggedIn, loginRouter);
app.use('/register', checkIfLoggedIn, registerRouter);
app.use('/avatar-upload', authenticateToken, uploadRouter);
app.use('/game', authenticateToken, gameRouter);
app.use('/logout', authenticateToken, logoutRouter);

app.get('/waiting', authenticateToken, (req, res) => {
    res.render(path.resolve(viewPath, 'waiting.pug'));
});

app.all("*", (req, res) => {
    res.render(path.resolve(viewPath, "404.pug"));
});

if (isDev) {

    server.listen(port, host, () => {
        console.log(`App running at port: ${port}, host: ${host}.\n`);
    });
    
    process.on("exit", async () => {
        await db.sequelize.close();
    })

}

export default app;
