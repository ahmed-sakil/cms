import React, { useRef } from "react";
import {
  Printer,
  X,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export interface ScorecardData {
  examTitle: string;
  subject?: string | null;
  examType: string;
  examDate: string;
  totalMarks: number;
  passMarks: number;
  student: {
    fullName: string;
    rollNumber: string;
    branchName?: string;
    batchName?: string;
  };
  result: {
    marksObtained: number;
    grade: string;
    rank?: number | null;
    isPassed: boolean;
    remarks?: string | null;
    highestMarksInBatch?: number | null;
    batchTotalStudents?: number | null;
  };
}

interface PrintableScorecardModalProps {
  scorecard: ScorecardData;
  isOpen: boolean;
  onClose: () => void;
  institutionName?: string;
  institutionTagline?: string;
  institutionPhone?: string;
  institutionAddress?: string;
}

export const PrintableScorecardModal: React.FC<PrintableScorecardModalProps> = ({
  scorecard,
  isOpen,
  onClose,
  institutionName = "",
  institutionTagline = "",
  institutionPhone = "",
  institutionAddress = "",
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    toast.success("Printing academic scorecard");
  };

  const percentage = (
    (Number(scorecard.result.marksObtained) / Number(scorecard.totalMarks)) *
    100
  ).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-scorecard-area, #printable-scorecard-area * {
            visibility: visible;
          }
          #printable-scorecard-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 28px !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-surface border border-accent rounded-sm max-w-2xl w-full space-y-4 shadow-2xl p-6 max-h-[92vh] overflow-y-auto">
        {/* Modal Top Bar */}
        <div className="flex justify-between items-center border-b border-accent pb-3 no-print">
          <div>
            <h2 className="font-bold text-sm text-text-main flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-primary" /> Official Academic Scorecard
            </h2>
            <p className="text-xs text-text-muted">
              {scorecard.examTitle} • Roll:{" "}
              <span className="font-mono font-bold text-text-main">
                {scorecard.student.rollNumber}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:bg-brand-hover transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print Marksheet
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-accent rounded-sm hover:bg-accent-subtle text-text-muted hover:text-text-main transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Scorecard Voucher */}
        <div
          id="printable-scorecard-area"
          ref={printRef}
          className="bg-white text-black p-6 border-2 border-black rounded-xs space-y-5 shadow-xs text-xs font-sans"
        >
          {/* Letterhead */}
          <div className="border-b-2 border-black pb-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 bg-black text-white font-bold flex items-center justify-center rounded-xs text-[10px]">
                CMS
              </div>
              <h1 className="text-lg font-black tracking-tight uppercase">{institutionName}</h1>
            </div>
            <p className="text-[11px] text-gray-700 italic">{institutionTagline}</p>
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-600 pt-0.5">
              {scorecard.student.branchName && (
                <>
                  <span>{scorecard.student.branchName}</span>
                  <span>•</span>
                </>
              )}
              <span>{institutionAddress}</span>
              <span>•</span>
              <span>Helpline: {institutionPhone}</span>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-1.5 bg-black text-white rounded-xs">
            <h2 className="text-xs font-black tracking-widest uppercase">
              OFFICIAL ASSESSMENT MARKSHEET & PERFORMANCE REPORT
            </h2>
          </div>

          {/* Student & Exam Info */}
          <div className="border border-black p-3 rounded-xs space-y-2">
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <div>
                <span className="text-gray-500 text-[11px]">Student Name: </span>
                <span className="font-bold text-black">{scorecard.student.fullName}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Roll Number: </span>
                <span className="font-mono font-bold text-black">
                  {scorecard.student.rollNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Enrolled Batch: </span>
                <span className="font-semibold text-black">
                  {scorecard.student.batchName || "Academic Batch"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Exam Date: </span>
                <span className="text-black font-mono">
                  {new Date(scorecard.examDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Subject / Topic: </span>
                <span className="font-bold text-black">
                  {scorecard.subject || scorecard.examTitle}
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px]">Assessment Type: </span>
                <span className="font-mono uppercase text-black">{scorecard.examType}</span>
              </div>
            </div>
          </div>

          {/* Score Details Table */}
          <div className="border border-black rounded-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-black text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2 px-3">Subject / Module</th>
                  <th className="py-2 px-3 text-right">Full Marks</th>
                  <th className="py-2 px-3 text-right">Pass Marks</th>
                  <th className="py-2 px-3 text-right">Marks Obtained</th>
                  <th className="py-2 px-3 text-center">Score %</th>
                  <th className="py-2 px-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                <tr>
                  <td className="py-3 px-3 font-bold text-black">
                    {scorecard.subject || scorecard.examTitle}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">
                    {scorecard.totalMarks}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-gray-600">
                    {scorecard.passMarks}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-sm text-black">
                    {scorecard.result.marksObtained}
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-bold">
                    {percentage}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 border border-black font-black text-xs bg-gray-100">
                      {scorecard.result.grade}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Performance Summary & Badges */}
          <div className="flex justify-between items-center bg-gray-50 border border-black p-3 rounded-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 border-2 font-black text-xs uppercase tracking-wider rounded-xs ${
                    scorecard.result.isPassed
                      ? "border-green-700 text-green-800 bg-green-50"
                      : "border-red-700 text-red-800 bg-red-50"
                  }`}
                >
                  {scorecard.result.isPassed ? "★ PASSED ★" : "★ FAILED ★"}
                </span>

                {scorecard.result.rank && (
                  <span className="px-3 py-1 border border-black font-mono font-bold text-xs bg-white">
                    Rank in Batch: #{scorecard.result.rank}
                    {scorecard.result.batchTotalStudents
                      ? ` of ${scorecard.result.batchTotalStudents}`
                      : ""}
                  </span>
                )}
              </div>

              {scorecard.result.highestMarksInBatch !== undefined &&
                scorecard.result.highestMarksInBatch !== null && (
                  <p className="text-[11px] text-gray-700 pt-1">
                    Highest Mark in Batch:{" "}
                    <span className="font-mono font-bold">
                      {scorecard.result.highestMarksInBatch}
                    </span>{" "}
                    / {scorecard.totalMarks}
                  </p>
                )}
            </div>

            {scorecard.result.remarks && (
              <div className="max-w-xs text-right">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">
                  Instructor Remarks
                </span>
                <p className="text-xs text-black italic leading-tight">
                  "{scorecard.result.remarks}"
                </p>
              </div>
            )}
          </div>

          {/* Evaluation Signatures */}
          <div className="pt-8 flex justify-between items-end text-center text-xs">
            <div className="w-44 border-t border-black pt-1">
              <p className="font-semibold text-black">Subject Teacher</p>
              <p className="text-[10px] text-gray-500">Signature</p>
            </div>

            <div className="w-48 border-t border-black pt-1">
              <p className="font-bold text-black">Academic Coordinator</p>
              <p className="text-[10px] text-gray-500">Verified & Sealed</p>
            </div>
          </div>

          {/* Footer Notice */}
          <p className="text-[9px] text-gray-500 text-center border-t border-gray-200 pt-2 italic">
            This is an authentic student performance report generated by {institutionName}.
          </p>
        </div>
      </div>
    </div>
  );
};
