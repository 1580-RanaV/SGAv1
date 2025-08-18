"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import domtoimage from "dom-to-image";
import Button from "./ui/Button";

export default function ExportPdfDomToImage({ targetRef, fileName = "skills-gap-report.pdf" }) {
  const exporting = useRef(false);

  const handleExport = async () => {
    if (exporting.current) return;
    exporting.current = true;

    try {
      const node = targetRef?.current;
      if (!node) {
        alert('Export target not found. (Missing ref?)');
        return;
      }

      console.log('Starting PDF export with dom-to-image...');

      // Ensure fonts are loaded
      if (document.fonts && document.fonts.ready) {
        try { 
          await document.fonts.ready; 
          console.log('Fonts loaded');
        } catch (e) {
          console.warn('Font loading check failed:', e);
        }
      }

      console.log('Capturing with dom-to-image...');
      
      // Get the actual rendered dimensions
      const rect = node.getBoundingClientRect();
      const nodeWidth = rect.width;
      const nodeHeight = rect.height;
      
      console.log(`Node dimensions: ${nodeWidth} x ${nodeHeight}`);
      
      // Capture at higher resolution but maintain proper aspect ratio
      const pixelRatio = 2; // For crisp text
      const captureWidth = nodeWidth * pixelRatio;
      const captureHeight = nodeHeight * pixelRatio;
      
      const dataUrl = await domtoimage.toPng(node, {
        quality: 1.0,
        bgcolor: '#ffffff',
        width: captureWidth,
        height: captureHeight,
        style: {
          transform: `scale(${pixelRatio})`,
          transformOrigin: 'top left',
          width: nodeWidth + 'px',
          height: nodeHeight + 'px'
        },
        filter: (element) => {
          // Skip elements that might cause issues
          return !(element.tagName === 'SCRIPT' || 
                  element.tagName === 'NOSCRIPT' ||
                  element.classList?.contains('no-export'));
        }
      });

      console.log('Image captured, generating PDF...');

      // Create PDF with proper scaling
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210; // A4 width in mm
      const pageH = 297; // A4 height in mm
      const margin = 15; // Reasonable margin
      
      // Calculate available space
      const availableW = pageW - (margin * 2);
      const availableH = pageH - (margin * 2);
      
      // Calculate scaling to fit content properly (like browser print)
      const scaleW = availableW / (nodeWidth * 0.264583); // Convert px to mm (96 DPI)
      const scaleH = availableH / (nodeHeight * 0.264583);
      const scale = Math.min(scaleW, scaleH, 1); // Don't upscale, only downscale
      
      // Final dimensions in mm
      const imgW = (nodeWidth * 0.264583) * scale;
      const imgH = (nodeHeight * 0.264583) * scale;

      let position = margin;
      let heightLeft = imgH;

      // Center content horizontally if it doesn't fill the width
      const xOffset = margin + (availableW - imgW) / 2;

      // Add first page
      pdf.addImage(dataUrl, "PNG", xOffset, position, imgW, imgH);
      heightLeft -= availableH;

      // Add additional pages if needed
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgH - heightLeft);
        pdf.addImage(dataUrl, "PNG", xOffset, position, imgW, imgH);
        heightLeft -= availableH;
      }

      console.log('Saving PDF...');
      pdf.save(fileName);
      console.log('PDF export completed successfully');

    } catch (err) {
      console.error("PDF export failed:", err);
      
      // Fallback to simpler approach
      if (err.message.includes('oklch') || err.message.includes('oklab')) {
        alert('Modern CSS colors detected. Try using the fallback export method or update your CSS to use rgb/rgba colors.');
      } else {
        alert(`PDF export failed: ${err.message}. Check console for details.`);
      }
    } finally {
      exporting.current = false;
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting.current}
      data-force-white
      className="min-w-40 px-6 py-3 text-lg"
    >
      {exporting.current ? "Exporting..." : "Export PDF"}
    </Button>
  );
}