export const CLEAN_ENERGY_SOURCES = new Set<string>(["biomass", "nuclear", "hydro", "wind", "solar"])

export type EnergyTypePercentage = {
    [energyType: string]: number
}

export type Day = {
    date: string,
    energyTypes: EnergyTypePercentage[],
    cleanEnergyPercent: number
}

export type EnergyMixType = {
    averageEnergyTypePercentage: EnergyTypePercentage[]
    cleanEnergyPercent: number
    days: Day[]
}

export type IntervalStatistic = {
    from: string,
    to: string,
    generationmix: EnergyTypePercentage[]
}

export type OptimalChargingType = {
    from: string,
    to: string,
    cleanEnergyPercent: number
}