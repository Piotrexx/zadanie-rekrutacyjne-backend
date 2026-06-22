import axios from "axios";
import { IntervalStatistic } from "./types";

async function fetchEnergyMixData(from:string, to:string) : Promise<Array<IntervalStatistic>> {
  const response = await axios.get(`https://api.carbonintensity.org.uk/generation/${from}/${to}`)
  return response.data.data;
}

export async function getThreeDaysData(date: Date) : Promise<Array<IntervalStatistic>> {
  const from = new Date(date);
  from.setDate(date.getDate() - 1);

  const to = new Date(date);
  to.setDate(date.getDate() + 1);

  return await fetchEnergyMixData(from.toISOString(), to.toISOString())
}

export async function getTwoDaysData() {
  const from = new Date()
  const to = new Date(from)
  to.setDate(from.getDate() + 2)

  return await fetchEnergyMixData(from.toISOString(), to.toISOString())
}

