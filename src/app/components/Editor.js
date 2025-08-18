"use client";

import { useRef, useState } from "react";
import Textarea from "./ui/Textarea";
import Button from "./ui/Button";

export default function Editor({ onAnalyze }) {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [jdFileName, setJdFileName] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [parsing, setParsing] = useState({ jd: false, resume: false });

  const jdInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const onAttachJdPdf = () => jdInputRef.current?.click();
  const onAttachResumePdf = () => resumeInputRef.current?.click();

  const handleJdFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setParsing((p) => ({ ...p, jd: true }));
      setJdFileName(file.name);

      // ✅ Lazy-load the helper only on the client
      const { extractTextFromPdfFile } = await import("../components/lib/pdf");
      const text = await extractTextFromPdfFile(file);

      setJd(text);
    } catch (err) {
      console.error(err);
      alert("Failed to parse JD PDF. Please check the console.");
    } finally {
      setParsing((p) => ({ ...p, jd: false }));
      e.target.value = ""; // reset input
    }
  };

  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setParsing((p) => ({ ...p, resume: true }));
      setResumeFileName(file.name);

      // ✅ Lazy-load the helper only on the client
      const { extractTextFromPdfFile } = await import("../components/lib/pdf");
      const text = await extractTextFromPdfFile(file);

      setResume(text);
    } catch (err) {
      console.error(err);
      alert("Failed to parse Resume PDF. Please check the console.");
    } finally {
      setParsing((p) => ({ ...p, resume: false }));
      e.target.value = ""; // reset input
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* JD card */}
      <div className="card">
        <div className="p-3 flex items-center justify-between gap-2">
          <div className="text-lg font-medium">Job Description</div>
          <div className="flex items-center gap-2">
            <input
              ref={jdInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleJdFileChange}
            />
            <Button className="bg-black text-white" variant="outline" onClick={onAttachJdPdf}>
              {parsing.jd ? "Parsing…" : "Attach PDF"}
            </Button>
          </div>
        </div>

        {jdFileName ? (
          <div className="px-3 pb-2 text-xs text-neutral-500">
            Attached: <span className="font-medium text-lg">{jdFileName}</span>
          </div>
        ) : null}

        <div className="px-3 pb-3">
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the JD here, or attach a PDF to auto-fill…"
          />
        </div>
      </div>

      {/* Resume card */}
      <div className="card">
        <div className="p-3 flex items-center justify-between gap-2">
          <div className="text-lg font-medium">Resume</div>
          <div className="flex items-center gap-2">
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleResumeFileChange}
            />
            <Button className="bg-black text-white" variant="outline" onClick={onAttachResumePdf}>
              {parsing.resume ? "Parsing…" : "Attach PDF"}
            </Button>
          </div>
        </div>

        {resumeFileName ? (
          <div className="px-3 pb-2 text-xs text-neutral-500">
            Attached: <span className="font-medium text-lg">{resumeFileName}</span>
          </div>
        ) : null}

        <div className="px-3 pb-3">
          <Textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Paste your resume here, or attach a PDF to auto-fill…"
          />
        </div>
      </div>

      <div className="md:col-span-2 flex items-center justify-end">
        <Button
          data-force-white
          onClick={() => onAnalyze({ jd, resume })}
          className="min-w-40 border-2"
        >
          Analyze
        </Button>
      </div>
    </div>
  );
}
