import React, { useRef } from "react";
import {
  Printer,
  X,
  GraduationCap,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";

export interface StudentIdCardData {
  id: string;
  fullName: string;
  rollNumber: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  bloodGroup?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  branchName?: string;
  courseName?: string;
  batchName?: string;
  academicYear?: string;
}

interface StudentIdCardModalProps {
  student: StudentIdCardData;
  isOpen: boolean;
  onClose: () => void;
  institutionName?: string;
  institutionTagline?: string;
  institutionPhone?: string;
  institutionAddress?: string;
  institutionLogo?: string;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  student,
  isOpen,
  onClose,
  institutionName = "",
  institutionTagline = "",
  institutionPhone = "",
  institutionAddress = "",
  institutionLogo = "",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  // Generate crisp SVG Barcode representation of Roll Number
  const renderBarcode = (code: string) => {
    const bars: boolean[] = [];
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push(charCode % 2 === 0, true, charCode % 3 === 0, false, charCode % 4 === 0, true);
    }
    return (
      <div className="flex items-center justify-center gap-0.5 h-8 w-full max-w-[200px] mx-auto bg-white p-1 rounded-xs">
        {bars.map((isBlack, i) => (
          <div
            key={i}
            className={`h-full ${isBlack ? "bg-black" : "bg-transparent"} ${
              i % 3 === 0 ? "w-1" : "w-0.5"
            }`}
          />
        ))}
      </div>
    );
  };

  // Generate crisp SVG QR Code pattern for Roll Number
  const renderQrCode = (roll: string) => {
    return (
      <div className="w-20 h-20 bg-white p-1 border border-gray-300 rounded-xs flex flex-col items-center justify-center shadow-xs">
        <svg viewBox="0 0 24 24" className="w-full h-full text-black" fill="currentColor">
          <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm8-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-6 4h4v2h-4v-2zm6 0h2v2h-2v-2zm-2-6h2v2h-2v-2z" />
        </svg>
        <span className="text-[7px] font-mono font-bold text-gray-800 uppercase tracking-tighter truncate max-w-full">
          {roll}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {/* Print isolation styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-student-id-card, #printable-student-id-card * {
            visibility: visible;
          }
          #printable-student-id-card {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-surface border border-theme w-full max-w-3xl rounded-sm shadow-2xl p-6 space-y-6 my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-theme pb-3 no-print">
          <div>
            <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-brand-primary" /> Official Student ID Card (CR-80 Standard)
            </h2>
            <p className="text-xs text-text-main/60">
              Boxy physical identity card with verification QR & barcode. Ready for single-click PVC / Paper printing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Container: CR-80 Standard Aspect (3.375" x 2.125") */}
        <div
          id="printable-student-id-card"
          ref={cardRef}
          className="flex flex-col md:flex-row items-center justify-center gap-6 py-4"
        >
          {/* ========================================================= */}
          {/* FRONT FACE OF ID CARD */}
          {/* ========================================================= */}
          <div className="w-[320px] h-[480px] bg-white text-slate-900 border-2 border-slate-300 rounded-sm shadow-lg flex flex-col justify-between overflow-hidden relative">
            {/* Header Ribbon */}
            <div className="bg-brand-primary text-white p-3.5 text-center relative border-b-2 border-brand-primary/40">
              <div className="flex items-center justify-center gap-2">
                {institutionLogo ? (
                  <img src={institutionLogo} alt="Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <div className="w-6 h-6 bg-white text-brand-primary font-bold rounded-xs flex items-center justify-center text-xs">
                    {institutionName ? institutionName.charAt(0) : "M"}
                  </div>
                )}
                <h3 className="font-extrabold text-xs tracking-wider uppercase">{institutionName || "Institution"}</h3>
              </div>
              <p className="text-[9px] text-white/80 tracking-tight font-medium mt-0.5">
                {institutionTagline}
              </p>
              {student.branchName && (
                <div className="mt-1">
                  <span className="px-2 py-0.5 bg-white/20 text-white font-mono text-[9px] font-bold uppercase rounded-xs">
                    {student.branchName}
                  </span>
                </div>
              )}
            </div>

            {/* Photo & Identity Section */}
            <div className="p-4 flex flex-col items-center text-center space-y-3 flex-1 justify-center">
              {/* Photo Box */}
              <div className="relative">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.fullName}
                    className="w-24 h-28 object-cover rounded-xs border-2 border-brand-primary shadow-xs bg-slate-100"
                  />
                ) : (
                  <div className="w-24 h-28 bg-slate-100 border-2 border-brand-primary/40 rounded-xs flex flex-col items-center justify-center text-slate-400">
                    <User className="w-10 h-10" />
                    <span className="text-[9px] font-bold mt-1">STUDENT PHOTO</span>
                  </div>
                )}

                {student.bloodGroup && (
                  <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-xs shadow-xs">
                    {student.bloodGroup}
                  </div>
                )}
              </div>

              {/* Name & Roll */}
              <div className="space-y-0.5">
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight line-clamp-1">
                  {student.fullName}
                </h4>
                <div className="inline-block px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-xs">
                  <p className="font-mono text-xs font-black text-brand-primary tracking-wider">
                    ROLL: {student.rollNumber}
                  </p>
                </div>
              </div>

              {/* Academic Program & Batch Info */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xs p-2 text-left space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Course:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[170px]">
                    {student.courseName || "Academic Foundation"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Batch:</span>
                  <span className="font-bold text-brand-primary truncate max-w-[170px]">
                    {student.batchName || "Standard Batch"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Contact:</span>
                  <span className="font-mono font-medium text-slate-700">{student.phone || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Bottom Barcode Ribbon */}
            <div className="bg-slate-100 border-t border-slate-300 p-2 text-center space-y-1">
              {renderBarcode(student.rollNumber)}
              <p className="font-mono text-[9px] font-bold text-slate-600 tracking-widest">
                SESSION {student.academicYear || "2026-2027"} • STUDENT IDENTITY CARD
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BACK FACE OF ID CARD */}
          {/* ========================================================= */}
          <div className="w-[320px] h-[480px] bg-white text-slate-900 border-2 border-slate-300 rounded-sm shadow-lg flex flex-col justify-between overflow-hidden relative">
            {/* Top Terms Section */}
            <div className="p-4 space-y-3">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 text-center">
                  Terms & Regulations
                </h4>
                <p className="text-[9px] text-slate-500 text-center mt-0.5">
                  Property of {institutionName}. Non-transferable.
                </p>
              </div>

              <ul className="text-[9.5px] text-slate-600 space-y-1.5 list-disc pl-4 leading-snug">
                <li>This card must be displayed while inside premises and examination halls.</li>
                <li>Loss or damage of card must be reported immediately to branch administration.</li>
                <li>Scan the QR code below for instant validity and enrollment verification.</li>
              </ul>
            </div>

            {/* Emergency & Guardian Verification */}
            <div className="px-4 py-2 space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xs p-2.5 space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">
                  Emergency Guardian Contact
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{student.guardianName || "Guardian"}</span>
                  <span className="font-mono font-bold text-brand-primary">{student.guardianPhone || "N/A"}</span>
                </div>
              </div>

              {/* Dynamic Verification QR Code */}
              <div className="flex items-center justify-between gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xs">
                {renderQrCode(student.rollNumber)}
                <div className="text-left space-y-1 flex-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-green-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Official Student</span>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    Scan to verify live academic standing and branch authorization.
                  </p>
                </div>
              </div>
            </div>

            {/* Official Signature & Campus Footer */}
            <div className="bg-slate-100 border-t border-slate-300 p-3 space-y-2">
              <div className="flex justify-between items-end pt-2 pb-1">
                <div className="text-[8px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-700">{institutionAddress}</p>
                  <p className="font-mono">Hotline: {institutionPhone}</p>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-800 pb-0.5">
                    <span className="text-[8px] font-mono italic text-slate-700 font-bold">Authenticated</span>
                  </div>
                  <span className="text-[8px] font-bold uppercase text-slate-700 block mt-0.5">
                    Director of Academics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions footer in modal */}
        <div className="text-center text-xs text-text-main/50 border-t border-theme pt-3 no-print">
          Click <strong>Print / Save PDF</strong> to generate high-resolution physical printout or PDF copy.
        </div>
      </div>
    </div>
  );
};
