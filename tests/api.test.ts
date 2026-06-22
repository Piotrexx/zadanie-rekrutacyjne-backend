import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("/api endpoints check", () => {
  it("checks health of 'mix' endpoint", async () => {
    const response = await request(app).get("/api/mix");

    expect(response.status).toBe(200);
  });
  it("check response of 'optimal_charging' with valid input", async () => {
    const response = await request(app).get("/api/optimal_charging?hours=4")
    expect(response.status).toBe(200)
  })
  it("check response of 'optimal_charging' with invalid input", async () => {
    const response = await request(app).get("/api/optimal_charging?hours=7")
    expect(response.status).toBe(400)
  })
it("check response of 'optimal_charging' with no input", async () => {
    const response = await request(app).get("/api/optimal_charging")
    expect(response.status).toBe(400)
  })
});