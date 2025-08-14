// src/app/components/charts/register.js
import {
  Chart as ChartJS,
  BarElement, CategoryScale, LinearScale,
  PointElement, LineElement, RadialLinearScale,
  Tooltip, Legend, Filler
} from "chart.js";

let registered = false;
export function registerCharts() {
  if (registered) return;
  ChartJS.register(
    BarElement, CategoryScale, LinearScale,
    PointElement, LineElement, RadialLinearScale,
    Tooltip, Legend, Filler
  );
  registered = true;
}
