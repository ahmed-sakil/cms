import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  GraduationCap,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Calendar,
  BookOpen,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/apiClient.js";

interface PublicFacultyData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  specialization?: string;
  qualification?: string;
  bio?: string;
  branch?: {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
  };
  educationalQualifications?: Array<{
    exam: string;
    institute: string;
    board?: string;
    year: string | number;
    result: string;
  }>;
  batches?: Array<{
    id: string;
    name: string;
    status: string;
    academicClass?: { name: string };
    course?: { name: string };
  }>;
}

export const FacultyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [faculty, setFaculty] = useState<PublicFacultyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<PublicFacultyData>(`/public/teachers/${id}`);
        if (res.success && res.data) {
          setFaculty(res.data);
        } else {
          setError(res.message || "Faculty profile not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load faculty profile");
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Faculty profile link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> Loading verified faculty profile...
        </div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text-main">Faculty Profile Unavailable</h2>
        <p className="text-xs text-text-muted">{error || "The requested faculty member was not found."}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Academy Home
        </Link>
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-accent rounded-sm text-xs font-semibold text-text-main hover:bg-bg-app transition-colors shadow-xs cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-brand-primary" /> Share Profile
        </button>
      </div>

      {/* Main Faculty Header Card */}
      <div className="bg-surface border border-accent rounded-sm overflow-hidden shadow-xs">
        {/* Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-brand-primary/20 via-brand-primary/10 to-indigo-500/20 border-b border-accent relative p-4 flex items-end justify-end">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface/90 backdrop-blur-xs border border-accent rounded-xs text-[11px] font-bold text-emerald-600 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Faculty
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-sm bg-surface border-4 border-surface shadow-md overflow-hidden shrink-0">
                {faculty.avatarUrl ? (
                  <img
                    src={faculty.avatarUrl}
                    alt={faculty.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-brand-primary/10 text-brand-primary font-bold text-2xl flex items-center justify-center">
                    {faculty.fullName?.[0] || "T"}
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-text-main tracking-tight">
                    {faculty.fullName}
                  </h1>
                  <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-brand-primary">
                  {faculty.specialization || "Faculty Instructor"}
                </p>
                <p className="text-xs text-text-muted">
                  {faculty.qualification || "Academic Mentor"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-app border border-accent rounded-xs text-text-muted">
                <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                {faculty.branch?.name || "Main Campus"}
              </span>
            </div>
          </div>

          {/* Contact & Desk Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-accent text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-primary shrink-0" />
              <span className="truncate">{faculty.email}</span>
            </div>
            {faculty.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                <span>{faculty.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-primary shrink-0" />
              <span className="truncate">{faculty.branch?.address || "Institutional Campus"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Bio & Academic Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Bio & Courses Taught */}
        <div className="md:col-span-2 space-y-6">
          {/* About & Teaching Philosophy */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-accent pb-2">
              <BookOpen className="w-4 h-4 text-brand-primary" /> Faculty Bio & Mentorship Philosophy
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed whitespace-pre-line">
              {faculty.bio || "Dedicated faculty educator committed to student excellence, structured problem solving, and analytical mastery."}
            </p>
          </div>

          {/* Current Batches & Cohorts */}
          <div className="bg-surface border border-accent rounded-sm p-6 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-accent pb-2">
              <Calendar className="w-4 h-4 text-brand-primary" /> Active Cohorts & Batches Under Mentorship
            </h2>
            {!faculty.batches || faculty.batches.length === 0 ? (
              <p className="text-xs text-text-muted py-2">
                Currently preparing syllabus and schedules for upcoming academy cohorts.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {faculty.batches.map((b) => (
                  <Link
                    key={b.id}
                    to={`/batches/${b.id}`}
                    className="p-3 bg-bg-app border border-accent rounded-sm hover:border-brand-primary transition-colors block space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                        {b.course?.name || "Program"}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 rounded-xs">
                        {b.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-text-main">{b.name}</h3>
                    {b.academicClass && (
                      <span className="text-[11px] text-text-muted block">
                        Class: {b.academicClass.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Academic Degrees & Qualifications */}
        <div className="space-y-6">
          <div className="bg-surface border border-accent rounded-sm p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-2 border-b border-accent pb-2">
              <GraduationCap className="w-4 h-4 text-brand-primary" /> Academic Degrees
            </h2>

            {faculty.educationalQualifications && faculty.educationalQualifications.length > 0 ? (
              <div className="space-y-3">
                {faculty.educationalQualifications.map((edu: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 bg-bg-app border border-accent rounded-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-main">{edu.degree || edu.exam}</span>
                      <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-xs">
                        Year: {edu.passingYear || edu.year}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">{edu.institute}</p>
                    {edu.board && edu.board.trim() && edu.board.toLowerCase() !== "n/a" && edu.board.toLowerCase() !== "null" && (
                      <p className="text-[11px] text-text-muted">
                        Board: {edu.board}
                      </p>
                    )}
                    {edu.result && (
                      <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">
                        Result: {edu.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-bg-app border border-accent rounded-sm space-y-1">
                <span className="text-xs font-bold text-text-main">
                  {faculty.qualification || "Higher Degree"}
                </span>
                <p className="text-[11px] text-text-muted">
                  Institutional faculty degree authenticated and verified by administration.
                </p>
              </div>
            )}
          </div>

          {/* Academic Seal Card */}
          <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-primary">
              <ShieldCheck className="w-4 h-4" /> Official Faculty Credential
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              This educator is an officially recognized instructor for {faculty.branch?.name || "Apex Academy"}. Academic qualifications and credentials have been verified by administration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfilePage;
