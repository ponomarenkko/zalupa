import request from "supertest";
import app from "../server.js";
import initialize from "../models/init.js";
import db from "../models/index.js";
import http from "http2";

const appRequest = request(app);
const User = db.sequelize.models.user;
const statusOK = http.constants.HTTP_STATUS_OK;

async function getLoginResponse(data) {

    return await appRequest
        .post("/login")
        .send(data)
        .set("Accept", "application/json")

}

describe("Login Requests", () => {

    beforeAll(async () => {
        await initialize();
        await User.create({
            login: "pbalazhy",
            password: "$2b$10$p9VGuK/KU4TPqnibmLrprepR.rdJpspbWOZWcx3CnAkR1gN7SZuXm",
            nickname: "pbalazhy"
        });
    });

    test("GET /login", async () => {

        const response = await appRequest.get("/login");
        expect(response.type).toContain("text/html");
        expect(response.status).toBe(statusOK);
        expect(response.text).toContain("<title>Authorization</title>");

    });

    test("POST /login (valid credentials)", async () => {

        const response = await getLoginResponse(
            { login: "pbalazhy", password: "pass1A" }
        );

        expect(response.type).toContain("application/json");
        expect(response.status).toBe(statusOK);
        expect(response.text).toBe(JSON.stringify({
            type: "success",
            text: "",
            redirect: "/?id=1"
        }));

    })

    test("POST /login (invalid login)", async () => {

        const response = await getLoginResponse(
            { login: "someuser", password: "pass1A" }
        );

        expect(response.type).toContain("application/json");
        expect(response.text).toBe(JSON.stringify({
            type: "error",
            text: "Login or password is invalid"
        }));

    });

    test("POST /login (invalid password)", async () => {

        const response = await getLoginResponse(
            { login: "pbalazhy", password: "pass1" }
        );

        expect(response.type).toContain("application/json");
        expect(response.text).toBe(JSON.stringify({
            type: "error",
            text: "Login or password is invalid"
        }));

    });

    afterAll(async () => {
        await db.sequelize.close();
    });

});
