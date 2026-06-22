import { describe, it, expect } from "vitest";
import { calculateAverageEachDay, calculateOptimalChargingTime } from "../src/energy/services";
import type { IntervalStatistic } from "../src/energy/types";

const interval = (
  from: string,
  to: string,
  mix: Array<{ fuel: string; perc: number }>,
): IntervalStatistic => ({ from, to, generationmix: mix as any });

const cleanMix = (clean: number) => [
  { fuel: "gas", perc: 100 - clean },
  { fuel: "wind", perc: clean },
];

describe("calculateAverageEachDay", () => {
  it("returns clean energy percent per day and overall", () => {
    const data = {
      "2025-01-01": [
        interval("t1", "t2", [
          { fuel: "wind", perc: 40 },
          { fuel: "solar", perc: 20 },
          { fuel: "gas", perc: 40 },
        ]),
      ],
    };
    const result = calculateAverageEachDay(data);
    expect(result.days).toHaveLength(1);
    expect(result.days[0].cleanEnergyPercent).toBe(60);
    expect(result.cleanEnergyPercent).toBeGreaterThan(0);
  });

  it("handles zero clean energy", () => {
    const data = {
      "2025-01-01": [interval("t1", "t2", [{ fuel: "gas", perc: 100 }])],
    };
    const result = calculateAverageEachDay(data);
    expect(result.days[0].cleanEnergyPercent).toBe(0);
  });
});

describe("calculateOptimalChargingTime", () => {
  it("picks the window with highest clean energy", () => {
    const intervals = [
      interval("2025-01-01T00:00Z", "2025-01-01T00:30Z", cleanMix(10)),
      interval("2025-01-01T00:30Z", "2025-01-01T01:00Z", cleanMix(10)),
      interval("2025-01-01T01:00Z", "2025-01-01T01:30Z", cleanMix(90)),
      interval("2025-01-01T01:30Z", "2025-01-01T02:00Z", cleanMix(90)),
      interval("2025-01-01T02:00Z", "2025-01-01T02:30Z", cleanMix(50)),
      interval("2025-01-01T02:30Z", "2025-01-01T03:00Z", cleanMix(50)),
    ];
    expect(calculateOptimalChargingTime(1, intervals)).toEqual({
      from: "2025-01-01T01:00Z",
      to: "2025-01-01T02:00Z",
      cleanEnergyPercent: 90,
    });
  });

  it("spans across days when cleaner", () => {
    const intervals = [
      interval("2025-01-01T22:00Z", "2025-01-01T22:30Z", cleanMix(10)),
      interval("2025-01-01T22:30Z", "2025-01-01T23:00Z", cleanMix(10)),
      interval("2025-01-01T23:00Z", "2025-01-01T23:30Z", cleanMix(10)),
      interval("2025-01-01T23:30Z", "2025-01-02T00:00Z", cleanMix(80)),
      interval("2025-01-02T00:00Z", "2025-01-02T00:30Z", cleanMix(80)),
      interval("2025-01-02T00:30Z", "2025-01-02T01:00Z", cleanMix(10)),
    ];
    const result = calculateOptimalChargingTime(1, intervals);
    expect(result.from).toBe("2025-01-01T23:30Z");
    expect(result.to).toBe("2025-01-02T00:30Z");
  });

  it("handles different window sizes", () => {
    const intervals: IntervalStatistic[] = [];
    for (let h = 0; h < 48; h++) {
      const startHour = Math.floor(h / 2);
      const minute = h % 2 === 0 ? "00" : "30";
      const from = `2025-01-01T${String(startHour).padStart(2, "0")}:${minute}Z`;
      const to = new Date(new Date(from).getTime() + 30 * 60000).toISOString();
      intervals.push(interval(from, to, cleanMix(startHour >= 4 && startHour < 10 ? 100 : 5)));
    }
    expect(calculateOptimalChargingTime(6, intervals).cleanEnergyPercent).toBe(100);
  });

  it("picks first window on tie", () => {
    const intervals = Array.from({ length: 10 }, (_, i) =>
      interval(
        `2025-01-01T${String(i).padStart(2, "0")}:00Z`,
        `2025-01-01T${String(i).padStart(2, "0")}:30Z`,
        cleanMix(50),
      ),
    );
    const result = calculateOptimalChargingTime(1, intervals);
    expect(result.from).toBe("2025-01-01T00:00Z");
    expect(result.cleanEnergyPercent).toBe(50);
  });
});
