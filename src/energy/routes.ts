import { Router, Request, Response } from "express";
import { z } from "zod";
import { calculateEnergyMix, calculateOptimalChargingTime } from "./services";
import { getTwoDaysData } from "./client";

export const energyRouter = Router()

const hoursSchema = z.coerce.number().int().min(1).max(6);

energyRouter.get("/mix", async (_req: Request, res: Response) => {
    const response = await calculateEnergyMix()
    res.json(response)
})

energyRouter.get("/optimal_charging", async (req: Request, res: Response) => {
    const parsed = hoursSchema.safeParse(req.query.hours);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues });
        return;
    }
    const data = await getTwoDaysData();
    const result = calculateOptimalChargingTime(parsed.data, data);
    res.json(result);
})