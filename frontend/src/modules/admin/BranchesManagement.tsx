import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  X,
  GraduationCap,
  Calendar,
  Edit2,
  Crown,
  Loader2,
  Sparkles,
  Users,
  UserCheck,
  Briefcase,
  MessageSquare,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { BranchRecord, StaffRecord } from "../../types/index.js";

export const BranchesManagement: React.FC = () => {
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRecord | null>(null);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";
  const userBranchId = currentUser?.branchId || currentUser?.branch?.id || "";

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    whatsappNumber: "",
    description: "",
    establishedYear: "",
    directorId: "",
    managerId: "",
    isMainBranch: false,
  });

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/admin/branches", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBranches(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch branches:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/admin/staffs", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setStaffMembers(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch staff list:", err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchStaff();
  }, []);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setFormData({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      whatsappNumber: "",
      description: "",
      establishedYear: "",
      directorId: "",
      managerId: "",
      isMainBranch: branches.length === 0, // Default to true if first branch
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchRecord) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone || "",
      email: branch.email || "",
      whatsappNumber: branch.whatsappNumber || "",
      description: branch.description || "",
      establishedYear: branch.establishedYear || "",
      directorId: branch.directorId || "",
      managerId: branch.managerId || "",
      isMainBranch: Boolean(branch.isMainBranch),
    });
    setIsModalOpen(true);
  };

  const handleSetMainBranch = async (id: string, name: string) => {
    const token = localStorage.getItem("cms_token");
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/v1/admin/branches/${id}/set-main`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to designate main campus");
      }

      toast.success(`'${name}' is now the Main Campus (Headquarters)! Central location synced.`);
      await fetchBranches();
    } catch (err: any) {
      toast.error(err.message || "Could not set main campus");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.address.trim()) {
      toast.error("Please fill in required campus fields (Name, Code, Address)");
      return;
    }

    const token = localStorage.getItem("cms_token");

    try {
      if (editingBranch) {
        // Update existing branch
        const res = await fetch(`/api/v1/admin/branches/${editingBranch.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to update branch");
        }

        toast.success(`Campus '${formData.name}' updated successfully!`);
      } else {
        // Create new branch
        const res = await fetch("/api/v1/admin/branches", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to create branch");
        }

        toast.success(`Campus '${formData.name}' established successfully!`);
      }

      setIsModalOpen(false);
      await fetchBranches();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const token = localStorage.getItem("cms_token");
    try {
      const res = await fetch(`/api/v1/admin/branches/${id}/toggle`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to toggle status");
      }

      setBranches((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
      );
      toast.info(json.message || "Campus status updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-primary" /> Multi-Branch Network
          </h1>
          <p className="text-xs text-text-main/60 mt-0.5">
            Manage physical campuses, designate your central headquarters, student capacities, and active operational status.
          </p>
        </div>

        {isBranchAdmin ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold rounded-sm">
            <ShieldCheck className="w-4 h-4" />
            Campus Scoped Mode ({currentUser?.branch?.name || "Assigned Campus"})
          </div>
        ) : (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-3 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" /> Establish Campus Branch
          </button>
        )}
      </div>

      {isBranchAdmin && (
        <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-sm flex items-start gap-2.5 text-xs text-text-main">
          <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-brand-primary">Branch Administrator Scope: </span>
            You have operational management access for your assigned campus. Establishing new branches, activating/deactivating campuses, and transferring the Central Headquarters designation are reserved exclusively for Super Administrators.
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-surface border border-theme rounded-sm p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-theme/40 rounded-xs" />
                  <div className="h-5 w-36 bg-theme/40 rounded-xs" />
                </div>
                <div className="h-4 w-20 bg-theme/40 rounded-xs" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-theme/30 rounded-xs" />
                <div className="h-3 w-3/4 bg-theme/30 rounded-xs" />
              </div>
              <div className="h-14 bg-bg-app rounded-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && branches.length === 0 && (
        <div className="p-12 text-center bg-surface border border-theme rounded-sm space-y-3">
          <Building2 className="w-10 h-10 text-text-main/30 mx-auto" />
          <h3 className="text-sm font-bold text-text-main">No Campuses Configured</h3>
          <p className="text-xs text-text-main/60 max-w-sm mx-auto">
            You have not registered any branch campuses yet. Establish your first branch to activate multi-branch operations.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Establish First Campus
          </button>
        </div>
      )}

      {/* Campus Grid */}
      {!isLoading && branches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`bg-surface border rounded-sm p-5 flex flex-col justify-between transition-colors shadow-xs ${
                b.isMainBranch
                  ? "border-amber-400 dark:border-amber-600/70 ring-1 ring-amber-400/20"
                  : "border-theme hover:border-brand-primary/50"
              }`}
            >
              <div className="space-y-3">
                {/* Header & Badges */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-bg-app border border-theme text-text-main/70 rounded-xs uppercase">
                        {b.code}
                      </span>
                      {b.establishedYear && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-bg-app border border-theme text-text-main/50 rounded-xs">
                          Est. {b.establishedYear}
                        </span>
                      )}
                      {b.isMainBranch && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-xs bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60 shadow-xs">
                          <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" /> MAIN CAMPUS (HQ)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-text-main mt-1.5">{b.name}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-xs border shrink-0 ${
                      b.isActive
                        ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300"
                        : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    {b.isActive ? "OPERATIONAL" : "INACTIVE"}
                  </span>
                </div>

                {/* Description if present */}
                {b.description && (
                  <p className="text-xs text-text-main/70 line-clamp-2 leading-relaxed bg-bg-app/40 p-2 border border-theme rounded-xs">
                    {b.description}
                  </p>
                )}

                {/* Contact & Location Details */}
                <div className="space-y-1.5 text-xs text-text-main/70 pt-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                  {b.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="font-mono">{b.phone}</span>
                    </div>
                  )}
                  {b.whatsappNumber && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                        {b.whatsappNumber}
                      </span>
                    </div>
                  )}
                  {b.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      <span className="truncate">{b.email}</span>
                    </div>
                  )}
                </div>

                {/* Leadership Section */}
                <div className="pt-2.5 border-t border-theme grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-bg-app border border-theme rounded-sm">
                    <p className="text-[10px] font-bold text-text-main/50 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-500" /> Branch Director
                    </p>
                    <p className="font-bold text-text-main text-xs truncate mt-0.5">
                      {b.director?.fullName || "Unassigned"}
                    </p>
                    {b.director?.phone && (
                      <p className="text-[10px] font-mono text-text-main/60 truncate">{b.director.phone}</p>
                    )}
                  </div>
                  <div className="p-2 bg-bg-app border border-theme rounded-sm">
                    <p className="text-[10px] font-bold text-text-main/50 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-brand-primary" /> Branch Manager
                    </p>
                    <p className="font-bold text-text-main text-xs truncate mt-0.5">
                      {b.manager?.fullName || "Unassigned"}
                    </p>
                    {b.manager?.phone && (
                      <p className="text-[10px] font-mono text-text-main/60 truncate">{b.manager.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Metrics & Operations Dock */}
              <div className="pt-4 mt-4 border-t border-theme space-y-3">
                {/* 5-part Assigned Metrics Breakdown */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-1.5 bg-bg-app border border-theme rounded-sm">
                      <p className="font-bold text-xs text-text-main flex items-center justify-center gap-1">
                        <Users className="w-3 h-3 text-blue-500" /> {b._count?.students ?? 0}
                      </p>
                      <p className="text-[9px] text-text-main/60 uppercase font-semibold">Students</p>
                    </div>
                    <div className="p-1.5 bg-bg-app border border-theme rounded-sm">
                      <p className="font-bold text-xs text-text-main flex items-center justify-center gap-1">
                        <GraduationCap className="w-3 h-3 text-amber-500" /> {b._count?.teachers ?? 0}
                      </p>
                      <p className="text-[9px] text-text-main/60 uppercase font-semibold">Faculty</p>
                    </div>
                    <div className="p-1.5 bg-bg-app border border-theme rounded-sm">
                      <p className="font-bold text-xs text-text-main flex items-center justify-center gap-1">
                        <UserCheck className="w-3 h-3 text-purple-500" /> {b._count?.staff ?? 0}
                      </p>
                      <p className="text-[9px] text-text-main/60 uppercase font-semibold">Staff</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-center text-xs">
                    <div className="p-1.5 bg-bg-app border border-theme rounded-sm">
                      <p className="font-bold text-xs text-text-main flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-primary" /> {b._count?.batches ?? 0}
                      </p>
                      <p className="text-[9px] text-text-main/60 uppercase font-semibold">Batches</p>
                    </div>
                    <div className="p-1.5 bg-bg-app border border-theme rounded-sm">
                      <p className="font-bold text-xs text-text-main flex items-center justify-center gap-1">
                        <BookOpen className="w-3 h-3 text-emerald-500" /> {b._count?.courses ?? 0}
                      </p>
                      <p className="text-[9px] text-text-main/60 uppercase font-semibold">Courses</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  {b.isMainBranch ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      <Sparkles className="w-3 h-3" /> Central HQ
                    </span>
                  ) : !isBranchAdmin ? (
                    <button
                      type="button"
                      disabled={actionLoadingId === b.id}
                      onClick={() => handleSetMainBranch(b.id, b.name)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 disabled:opacity-50"
                      title="Make this the organization's central headquarters"
                    >
                      {actionLoadingId === b.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Crown className="w-3 h-3" />
                      )}
                      Make Main Campus
                    </button>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2">
                    {!isBranchAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(b.id)}
                        className="text-[11px] font-semibold text-text-main/70 hover:text-text-main"
                      >
                        {b.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}

                    {(!isBranchAdmin || b.id === userBranchId) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-theme text-xs font-semibold text-text-main rounded-sm hover:border-brand-primary transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-brand-primary" /> Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-surface border border-theme rounded-sm max-w-xl w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex justify-between items-center border-b border-theme pb-2">
              <h3 className="font-bold text-sm text-text-main flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-primary" />
                {editingBranch ? "Edit Campus Details" : "Establish New Campus Branch"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-text-main/40 hover:text-text-main rounded-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Campus Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhanmondi Campus"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Campus Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    disabled={isBranchAdmin}
                    placeholder="e.g. DH-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Physical Location / Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street, area, city (e.g. House 42, Road 7/A, Dhanmondi, Dhaka)"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Office Helpline Phone</label>
                  <input
                    type="tel"
                    placeholder="+880 1..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Branch Email</label>
                  <input
                    type="email"
                    placeholder="branch@institution.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">WhatsApp Admission Helpline</label>
                  <input
                    type="tel"
                    placeholder="+880 1..."
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Established Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2018"
                    value={formData.establishedYear}
                    onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              {/* Leadership Assignments: Director and Manager from Staff List */}
              <div className="p-3 bg-bg-app border border-theme rounded-sm space-y-3">
                <p className="text-xs font-bold text-text-main flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-primary" /> Campus Administration & Leadership
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Branch Director
                    </label>
                    <select
                      value={formData.directorId}
                      onChange={(e) => setFormData({ ...formData, directorId: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value="">-- None / Unassigned --</option>
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} {s.designation ? `(${s.designation})` : `(${s.email})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-main flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-brand-primary" /> Branch Manager
                    </label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-surface border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value="">-- None / Unassigned --</option>
                      {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} {s.designation ? `(${s.designation})` : `(${s.email})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Branch Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Branch Description / Amenities</label>
                <textarea
                  rows={2}
                  placeholder="Academic environment, laboratory facilities, classrooms, transport services, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              {/* Main Campus Designation Toggle */}
              {!isBranchAdmin && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-sm flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="isMainBranchToggle"
                    checked={formData.isMainBranch}
                    onChange={(e) => setFormData({ ...formData, isMainBranch: e.target.checked })}
                    className="mt-0.5 rounded-xs accent-amber-600"
                  />
                  <label htmlFor="isMainBranchToggle" className="text-xs text-text-main cursor-pointer leading-tight">
                    <span className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                      <Crown className="w-3.5 h-3.5 text-amber-600" /> Set as Main Campus (Headquarters)
                    </span>
                    <span className="text-[11px] text-text-main/60 block mt-0.5">
                      Designates this campus as the central organization headquarters. The physical address, helpline, and WhatsApp number on the public landing page and organization settings will automatically synchronize with this branch.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  {editingBranch ? "Save Campus Changes" : "Establish Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
