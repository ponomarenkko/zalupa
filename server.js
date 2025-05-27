import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import initializeDatabase from "./models/init.js";
import { checkIfLoggedIn, authenticateToken } from "./auth/auth_file_upload.js";

import loginRoutes from "./routes/login.js";
import registerRoutes from "./routes/register.js";
import uploadRoutes from "./routes/avatar-upload.js";
import gameRoutes from "./routes/game.js";
import logoutRoutes from "./routes/logout.js";

import db from "./models/index.js";
import http from "http";
import { Server } from "socket.io";
import socketHandler from "./socket.js";

const app = express();
const host = "localhost";
const port = 3000;

const viewsDirectory = path.join("public", "views");
const isDevelopment = process.env.NODE_ENV !== "test";

// Setup HTTP and WebSocket server
const httpServer = http.createServer(app);
const io = new Server(httpServer);

// Attach socket handler to socket.io
io.on("connection", socketHandler.bind(io));

// Initialize database only if not in test environment
if (isDevelopment) {
    initializeDatabase().catch((err) => console.error("DB Initialization Error:", err));
}

// Set view engine and directory
app.set("view engine", "pug");
app.set("views", path.resolve(viewsDirectory));

// Middleware stack
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve("public")));

// Routes
app.get("/", authenticateToken, (req, res) => {
    res.render(path.resolve(viewsDirectory, "index.pug"));
});

app.use("/login", checkIfLoggedIn, loginRoutes);
app.use("/register", checkIfLoggedIn, registerRoutes);
app.use("/avatar-upload", authenticateToken, uploadRoutes);
app.use("/game", authenticateToken, gameRoutes);
app.use("/logout", authenticateToken, logoutRoutes);

app.get("/waiting", authenticateToken, (req, res) => {
    res.render(path.resolve(viewsDirectory, "waiting.pug"));
});

// Catch-all route for 404s
app.all("*", (req, res) => {
    res.status(404).render(path.resolve(viewsDirectory, "404.pug"));
});

// Start server in development mode and clean up on exit
if (isDevelopment) {
    httpServer.listen(port, host, () => {
        console.log(`Server is live at http://${host}:${port}`);
    });

    process.on("exit", async () => {
        await db.sequelize.close();
    });
}

export default app;
