// src/lib/pdf.js
// Client-only PDF text extractor using pdfjs-dist with a self-hosted worker.

export async function extractTextFromPdfFile(file) {
  if (!file || file.type !== "application/pdf") {
    throw new Error("Please select a PDF file.");
  }
  if (typeof window === "undefined") {
    throw new Error("PDF parsing must run in the browser.");
  }

  // ESM build (v5+)
  const pdfjsLib = await import("pdfjs-dist/build/pdf");

  // Use the worker that you copied to /public — version must match your installed pdfjs-dist
  // If you copied the module worker:
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
  // If you instead copied the legacy worker, comment the line above and uncomment below:
  // pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let text = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n\n";
  }

  return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
