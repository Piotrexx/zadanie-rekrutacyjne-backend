import { getThreeDaysData } from "./client";
import {
  CLEAN_ENERGY_SOURCES,
  EnergyMixType,
  IntervalStatistic,
  OptimalChargingType,
} from "./types";

export function calculateAverageEachDay(
  daysData: Record<string, IntervalStatistic[]>,
): EnergyMixType {
  const totalStatistics: Record<string, { sum: number; count: number }> = {};
  const averageCleanEnergy: { sum: number; count: number } = {
    sum: 0,
    count: 0,
  };
  const averageDaysStatistic = Object.entries(daysData).map(
    ([date, intervals]) => {
      const totals: Record<string, { sum: number; count: number }> = {};

      for (const interval of intervals) {
        for (const item of interval.generationmix) {
          const fuel = (item as any).fuel;
          const perc = (item as any).perc as number;
          if (!totals[fuel]) totals[fuel] = { sum: 0, count: 0 };
          if (!totalStatistics[fuel])
            totalStatistics[fuel] = { sum: 0, count: 0 };
          totals[fuel].sum += perc;
          totals[fuel].count++;
          totalStatistics[fuel].sum += perc;
          totalStatistics[fuel].count++;
        }
      }

      const avgMix: Record<string, number> = {};
      let cleanEnergyTotal = 0;

      for (const [fuel, { sum, count }] of Object.entries(totals)) {
        const avg = Math.round(sum / count);
        avgMix[fuel] = avg;
        if (CLEAN_ENERGY_SOURCES.includes(fuel)) {
          averageCleanEnergy.count += 1;
          cleanEnergyTotal += avg;
        }
      }
      averageCleanEnergy.sum += cleanEnergyTotal;

      return {
        date,
        energyTypes: [avgMix],
        cleanEnergyPercent: cleanEnergyTotal,
      };
    },
  );

  return {
    days: averageDaysStatistic,
    cleanEnergyPercent: Math.round(
      averageCleanEnergy.sum / averageCleanEnergy.count,
    ),
    averageEnergyTypePercentage: Object.entries(totalStatistics).map(
      ([fuel, data]) => {
        return {
          [fuel]: Math.round(data.sum / data.count),
        };
      },
    ),
  };
}

export async function calculateEnergyMix(): Promise<EnergyMixType> {
  const data = await getThreeDaysData(new Date());

  const grouped: Record<string, typeof data> = {};
  for (const entry of data) {
    const dateKey = new Date(entry.from).toISOString().split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  }

  return await calculateAverageEachDay(grouped);
}

export function calculateOptimalChargingTime(
  hours: number,
  dayData: IntervalStatistic[],
): OptimalChargingType {
  const intervalsPerWindow = hours * 2;
  let bestStartIndex = 0;
  let bestAvg = 0;

  for (let i = 0; i <= dayData.length - intervalsPerWindow; i++) {
    let cleanSum = 0;

    for (let j = i; j < i + intervalsPerWindow; j++) {
      for (const item of dayData[j].generationmix) {
        const fuel = (item as any).fuel;
        const perc = (item as any).perc as number;
        if (CLEAN_ENERGY_SOURCES.includes(fuel)) {
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
    from: dayData[bestStartIndex].from,
    to: dayData[bestStartIndex + intervalsPerWindow - 1].to,
    cleanEnergyPercent: Math.round(bestAvg),
  };
}
