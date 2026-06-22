import { getThreeDaysData } from "./client";
import {
  CLEAN_ENERGY_SOURCES,
  EnergyMixType,
  IntervalStatistic,
  OptimalChargingType,
} from "./types";

const round = (n: number) => Math.round((n + Number.EPSILON) * 10) / 10;

export function calculateAverageEachDay(
  daysData: Record<string, IntervalStatistic[]>,
): EnergyMixType {

  const totalStatistics: Record<string, { sum: number; count: number }> = {};

  let allIntervalsCleanEnergySum = 0;
  let allIntervalsCount = 0;

  const averageDaysStatistic = Object.entries(daysData).map(
    ([date, intervals]) => {
      const dayStatistics: Record<string, { sum: number; count: number }> = {};

      let dayCleanEnergySum = 0;

      for (const interval of intervals) {
        let intervalCleanEnergy = 0;

        for (const item of interval.generationmix) {
          const fuel = item.fuel;
          const perc = item.perc;

          if (!dayStatistics[fuel]) {
            dayStatistics[fuel] = { sum: 0, count: 0 };
          }

          if (!totalStatistics[fuel]) {
            totalStatistics[fuel] = { sum: 0, count: 0 };
          }

          dayStatistics[fuel].sum += perc;
          dayStatistics[fuel].count++;

          totalStatistics[fuel].sum += perc;
          totalStatistics[fuel].count++;

          if (CLEAN_ENERGY_SOURCES.has(String(fuel))) {
            intervalCleanEnergy += perc;
          }
        }

        dayCleanEnergySum += intervalCleanEnergy;

        allIntervalsCleanEnergySum += intervalCleanEnergy;
        allIntervalsCount++;
      }

      const avgMix: Record<string, number> = {};

      for (const [fuel, { sum, count }] of Object.entries(dayStatistics)) {
        avgMix[fuel] = round(sum / count);
      }

      return {
        date,
        energyTypes: [avgMix],
        cleanEnergyPercent:
          intervals.length > 0
            ? round(dayCleanEnergySum / intervals.length)
            : 0,
      };
    },
  );

  return {
    days: averageDaysStatistic,
    cleanEnergyPercent:
      allIntervalsCount > 0
        ? round(allIntervalsCleanEnergySum / allIntervalsCount)
        : 0,
    averageEnergyTypePercentage: Object.entries(totalStatistics).map(
      ([fuel, { sum, count }]) => {
        return {
          [fuel]: round(sum / count),
        };
      },
    ),
  };
}

export async function calculateEnergyMix(): Promise<EnergyMixType> {
  const data = await getThreeDaysData(new Date());

  const grouped: Record<string, typeof data> = {};
  for (const entry of data) {
    const dateKey = entry.from.slice(0, 10);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  }

  return calculateAverageEachDay(grouped);
}

export function calculateOptimalChargingTime(
  hours: number,
  forecastIntervals: IntervalStatistic[],
): OptimalChargingType {
  const intervalsPerWindow = hours * 2;
  let bestStartIndex = 0;
  let bestAvg = 0;

  for (let i = 0; i <= forecastIntervals.length - intervalsPerWindow; i++) {
    let cleanSum = 0;

    for (let j = i; j < i + intervalsPerWindow; j++) {
      for (const item of forecastIntervals[j].generationmix) {
        const fuel = (item as any).fuel;
        const perc = (item as any).perc as number;
        if (CLEAN_ENERGY_SOURCES.has(fuel)) {
          cleanSum += perc;
        }
      }
    }

    const avg = cleanSum / intervalsPerWindow;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestStartIndex = i;
    }
  }

  return {
    from: forecastIntervals[bestStartIndex].from,
    to: forecastIntervals[bestStartIndex + intervalsPerWindow - 1].to,
    cleanEnergyPercent: round(bestAvg),
  };
}
