"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Button from "./ui/Button";

export default function ExportPdf() {
  const exporting = useRef(false);

  const withPdfColorFallback = async (fn) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/pdf-colors.css";
    document.head.appendChild(link);

    try {
      await new Promise((r) => requestAnimationFrame(() => r()));
      await fn();
    } finally {
      document.head.removeChild(link);
    }
  };

  const handleExport = async () => {
    if (exporting.current) return;
    exporting.current = true;

    try {
      const node = document.getElementById("reportRoot");
      if (!node) {
        alert('Could not find element with id="reportRoot".');
        return;
      }

      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch {}
      }

      await withPdfColorFallback(async () => {
        const canvas = await html2canvas(node, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false
        });

        const imgData = canvas.toDataURL("image/png");

        const pdf = new jsPDF("p", "mm", "a4");
        const pageW = 210;
        const pageH = 297;
        const margin = 10;

        const imgW = pageW - margin * 2;
        const imgH = (canvas.height * imgW) / canvas.width;

        let position = margin;
        let heightLeft = imgH;

        pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
        heightLeft -= (pageH - margin * 2);

        while (heightLeft > 0) {
          pdf.addPage();
          position = margin - (imgH - heightLeft);
          pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
          heightLeft -= (pageH - margin * 2);
        }

        pdf.save("skills-gap-report.pdf");
      });
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Check console for details.");
    } finally {
      exporting.current = false;
    }
  };

  return (
    <Button onClick={handleExport} className="min-w-40">
      Export PDF
    </Button>
  );
}
