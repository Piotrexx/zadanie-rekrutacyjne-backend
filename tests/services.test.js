"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const services_1 = require("../src/energy/services");
const interval = (from, to, mix) => ({ from, to, generationmix: mix });
const cleanMix = (clean) => [
    { fuel: "gas", perc: 100 - clean },
    { fuel: "wind", perc: clean },
];
(0, vitest_1.describe)("calculateAverageEachDay", () => {
    (0, vitest_1.it)("returns clean energy percent per day and overall", () => {
        const data = {
            "2025-01-01": [
                interval("t1", "t2", [
                    { fuel: "wind", perc: 40 },
                    { fuel: "solar", perc: 20 },
                    { fuel: "gas", perc: 40 },
                ]),
            ],
        };
        const result = (0, services_1.calculateAverageEachDay)(data);
        (0, vitest_1.expect)(result.days).toHaveLength(1);
        (0, vitest_1.expect)(result.days[0].cleanEnergyPercent).toBe(60);
        (0, vitest_1.expect)(result.cleanEnergyPercent).toBeGreaterThan(0);
    });
    (0, vitest_1.it)("handles zero clean energy", () => {
        const data = {
            "2025-01-01": [interval("t1", "t2", [{ fuel: "gas", perc: 100 }])],
        };
        const result = (0, services_1.calculateAverageEachDay)(data);
        (0, vitest_1.expect)(result.days[0].cleanEnergyPercent).toBe(0);
    });
});
(0, vitest_1.describe)("calculateOptimalChargingTime", () => {
    (0, vitest_1.it)("picks the window with highest clean energy", () => {
        const intervals = [
            interval("2025-01-01T00:00Z", "2025-01-01T00:30Z", cleanMix(10)),
            interval("2025-01-01T00:30Z", "2025-01-01T01:00Z", cleanMix(10)),
            interval("2025-01-01T01:00Z", "2025-01-01T01:30Z", cleanMix(90)),
            interval("2025-01-01T01:30Z", "2025-01-01T02:00Z", cleanMix(90)),
            interval("2025-01-01T02:00Z", "2025-01-01T02:30Z", cleanMix(50)),
            interval("2025-01-01T02:30Z", "2025-01-01T03:00Z", cleanMix(50)),
        ];
        (0, vitest_1.expect)((0, services_1.calculateOptimalChargingTime)(1, intervals)).toEqual({
            from: "2025-01-01T01:00Z",
            to: "2025-01-01T02:00Z",
            cleanEnergyPercent: 90,
        });
    });
    (0, vitest_1.it)("spans across days when cleaner", () => {
        const intervals = [
            interval("2025-01-01T22:00Z", "2025-01-01T22:30Z", cleanMix(10)),
            interval("2025-01-01T22:30Z", "2025-01-01T23:00Z", cleanMix(10)),
            interval("2025-01-01T23:00Z", "2025-01-01T23:30Z", cleanMix(10)),
            interval("2025-01-01T23:30Z", "2025-01-02T00:00Z", cleanMix(80)),
            interval("2025-01-02T00:00Z", "2025-01-02T00:30Z", cleanMix(80)),
            interval("2025-01-02T00:30Z", "2025-01-02T01:00Z", cleanMix(10)),
        ];
        const result = (0, services_1.calculateOptimalChargingTime)(1, intervals);
        (0, vitest_1.expect)(result.from).toBe("2025-01-01T23:30Z");
        (0, vitest_1.expect)(result.to).toBe("2025-01-02T00:30Z");
    });
    (0, vitest_1.it)("handles different window sizes", () => {
        const intervals = [];
        for (let h = 0; h < 48; h++) {
            const startHour = Math.floor(h / 2);
            const minute = h % 2 === 0 ? "00" : "30";
            const from = `2025-01-01T${String(startHour).padStart(2, "0")}:${minute}Z`;
            const to = new Date(new Date(from).getTime() + 30 * 60000).toISOString();
            intervals.push(interval(from, to, cleanMix(startHour >= 4 && startHour < 10 ? 100 : 5)));
        }
        (0, vitest_1.expect)((0, services_1.calculateOptimalChargingTime)(6, intervals).cleanEnergyPercent).toBe(100);
    });
    (0, vitest_1.it)("picks first window on tie", () => {
        const intervals = Array.from({ length: 10 }, (_, i) => interval(`2025-01-01T${String(i).padStart(2, "0")}:00Z`, `2025-01-01T${String(i).padStart(2, "0")}:30Z`, cleanMix(50)));
        const result = (0, services_1.calculateOptimalChargingTime)(1, intervals);
        (0, vitest_1.expect)(result.from).toBe("2025-01-01T00:00Z");
        (0, vitest_1.expect)(result.cleanEnergyPercent).toBe(50);
    });
});
