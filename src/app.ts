import express from "express";
import cors from "cors";
import { energyRouter } from "./energy/routes";
export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", energyRouter)