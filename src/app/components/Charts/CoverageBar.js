"use client";
import { useMemo, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { registerCharts } from "./register";

export default function CoverageBar({ skills = [], onBarClick }) {
  // skills: [{ skill, jdWeight:0..1, resumeScore:0..1 }]
  registerCharts();
  const chartRef = useRef(null);

  const labels = skills.map(s => s.skill);

  const data = useMemo(() => ({
  labels,
  datasets: [
    {
      label: "JD emphasis",
      data: skills.map(s => s.jdWeight ?? 0),
      backgroundColor: "rgba(229,231,235,0.7)", // light gray (Tailwind gray-200 w/ opacity)
      borderRadius: 6,
      maxBarThickness: 28,
    },
    {
      label: "Resume evidence",
      data: skills.map(s => s.resumeScore ?? 0),
      backgroundColor: "rgba(16,185,129,0.85)", // emerald-500 (nice green)
      borderRadius: 6,
      maxBarThickness: 28,
    },
  ],
}), [labels, skills]);


  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, max: 1, grid: { color: "rgba(0,0,0,0.06)" } },
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false } },
    },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = (ctx.parsed.y * 100).toFixed(0);
            return `${ctx.dataset.label}: ${pct}%`;
          },
        },
      },
    },
    onClick: (evt) => {
      if (!onBarClick) return;
      const chart = chartRef.current;
      if (!chart) return;
      const els = chart.getElementsAtEventForMode(evt, "nearest", { intersect: true }, true);
      if (!els?.length) return;
      const { index } = els[0];
      onBarClick(skills[index]); // send the clicked skill back up
    },
  }), [onBarClick, skills]);

  return (
    <div className="card p-3">
      <div className="text-sm font-medium mb-2">Skill Coverage (JD vs Resume)</div>
      {/* horizontal scroll if many skills */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[720px] h-72">
          <Bar ref={chartRef} data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
