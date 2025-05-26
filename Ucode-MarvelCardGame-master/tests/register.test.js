import request from "supertest";
import app from "../server.js";
import initialize from "../models/init.js";
import db from "../models/index.js";
import http from "http2";

const appRequest = request(app);
const statusOK = http.constants.HTTP_STATUS_OK;

async function getRegisterResponse(data) {

    return await appRequest
        .post("/register")
        .send(data)
        .set("Accept", "application/json")

}

describe("Register Requests", () => {

    beforeAll(async () => {
        await initialize();
    });

    test("GET /register", async () => {

        const response = await appRequest.get("/register");
        expect(response.type).toContain("text/html");
        expect(response.status).toBe(statusOK);
        expect(response.text).toContain("<title>Registration</title>");

    });

    test("POST /register (valid credentials)", async () => {

        const response = await getRegisterResponse({
            login: "newuser",password: "pass1A", nickname: "newuser" }
        );

        expect(response.type).toContain("application/json");
        expect(response.status).toBe(statusOK);
        expect(response.text).toBe(JSON.stringify({
            text: "You are successfully registered!",
            type: "success"
        }));

    })

    test("POST /register (invalid login)", async () => {

        const response = await getRegisterResponse(
            { login: "newuser", password: "pass1A", nickname: "newuser" }
        );

        expect(response.type).toContain("application/json");
        expect(response.text).toBe(JSON.stringify({
            text: "The user with this login already exists",
            type: "error"
        }));

    });

    test("POST /register (invalid nickname)", async () => {

        const response = await getRegisterResponse(
            { login: "otheruser", password: "pass1", nickname: "newuser" }
        );

        expect(response.type).toContain("application/json");
        expect(response.text).toBe(JSON.stringify({
            text: "The user with this nickname already exists",
            type: "error"
        }));

    });

    afterAll(async () => {
        await db.sequelize.close();
    });

});
