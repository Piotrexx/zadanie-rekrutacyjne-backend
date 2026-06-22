"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
(0, vitest_1.describe)("/api endpoints check", () => {
    (0, vitest_1.it)("checks health of 'mix' endpoint", async () => {
        const response = await (0, supertest_1.default)(app_1.app).get("/api/mix");
        (0, vitest_1.expect)(response.status).toBe(200);
    });
    (0, vitest_1.it)("check response of 'optimal_charging' with valid input", async () => {
        const response = await (0, supertest_1.default)(app_1.app).get("/api/optimal_charging?hours=4");
        (0, vitest_1.expect)(response.status).toBe(200);
    });
    (0, vitest_1.it)("check response of 'optimal_charging' with invalid input", async () => {
        const response = await (0, supertest_1.default)(app_1.app).get("/api/optimal_charging?hours=7");
        (0, vitest_1.expect)(response.status).toBe(400);
    });
    (0, vitest_1.it)("check response of 'optimal_charging' with no input", async () => {
        const response = await (0, supertest_1.default)(app_1.app).get("/api/optimal_charging");
        (0, vitest_1.expect)(response.status).toBe(400);
    });
});
