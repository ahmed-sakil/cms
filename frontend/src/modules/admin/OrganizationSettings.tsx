import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Building,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  X,
  Sliders,
  Loader2,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "../../components/common/FileUpload.js";
import { setDynamicFavicon } from "../../utils/dynamicFavicon.js";
import { BranchesManagement } from "./BranchesManagement.js";
import type { OrganizationSettings, PaymentChannel, PosterSlide } from "../../types/index.js";

export const OrganizationSettingsPage: React.FC = () => {
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("cms_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const isBranchAdmin = currentUser?.role === "BRANCH_ADMIN";

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "branding";
  const activeTab: "branding" | "payments" | "posters" | "branches" =
    ["branding", "payments", "posters", "branches"].includes(currentTab)
      ? (currentTab as any)
      : "branding";

  const setActiveTab = (tab: "branding" | "payments" | "posters" | "branches") => {
    setSearchParams({ tab });
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<PaymentChannel | null>(null);

  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [editingPoster, setEditingPoster] = useState<PosterSlide | null>(null);

  const [settings, setSettings] = useState<OrganizationSettings>({
    name: "",
    tagline: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    establishedYear: "",
    whatsappNumber: "",
    logoUrl: "",
    faviconUrl: "",
    paymentChannels: [],
    posters: [],
  });


  // Channel form state
  const [channelForm, setChannelForm] = useState<{
    provider: "BKASH" | "NAGAD" | "ROCKET" | "UPAY" | "BANK";
    accountType: "PERSONAL" | "MERCHANT" | "AGENT";
    accountNumber: string;
    instructions: string;
    isActive: boolean;
  }>({
    provider: "BKASH",
    accountType: "MERCHANT",
    accountNumber: "",
    instructions: "",
    isActive: true,
  });

  // Poster form state
  const [posterForm, setPosterForm] = useState<PosterSlide>({
    title: "",
    subtitle: "",
    imageUrl: "",
    actionText: "Learn More",
    actionUrl: "#courses",
    order: 1,
    isActive: true,
  });

  // Load live settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("cms_token");
        const res = await fetch("/api/v1/admin/organization", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success && json.data) {
          setSettings((prev) => ({
            ...prev,
            ...json.data,
            paymentChannels: Array.isArray(json.data.paymentChannels) ? json.data.paymentChannels : [],
            posters: Array.isArray(json.data.posters) ? json.data.posters : [],
          }));
          setDynamicFavicon(json.data.faviconUrl, json.data.name);
        }
      } catch (err) {
        console.warn("Could not load backend organization settings, using local defaults");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const persistSettings = async (updatedSettings: OrganizationSettings, successMsg?: string) => {
    setSettings(updatedSettings);
    setDynamicFavicon(updatedSettings.faviconUrl, updatedSettings.name);
    setIsSaving(true);
    try {
      const token = localStorage.getItem("cms_token");
      const res = await fetch("/api/v1/admin/organization", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedSettings),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update settings");
      }

      if (successMsg) {
        toast.success(successMsg);
      }
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await persistSettings(settings, "Organization profile, posters, and payment channels saved!");
  };

  // ==========================================
  // PAYMENT CHANNELS MANAGEMENT
  // ==========================================
  const handleOpenAddChannel = () => {
    setEditingChannel(null);
    setChannelForm({
      provider: "BKASH",
      accountType: "MERCHANT",
      accountNumber: "",
      instructions: "",
      isActive: true,
    });
    setIsChannelModalOpen(true);
  };

  const handleOpenEditChannel = (channel: PaymentChannel) => {
    setEditingChannel(channel);
    setChannelForm({
      provider: channel.provider,
      accountType: channel.accountType,
      accountNumber: channel.accountNumber,
      instructions: channel.instructions || "",
      isActive: channel.isActive,
    });
    setIsChannelModalOpen(true);
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.accountNumber.trim()) {
      toast.error("Please enter account number");
      return;
    }

    if (editingChannel) {
      // Update existing
      const updatedChannels = settings.paymentChannels.map((c) =>
        c.id === editingChannel.id
          ? {
              ...c,
              provider: channelForm.provider,
              accountType: channelForm.accountType,
              accountNumber: channelForm.accountNumber,
              instructions: channelForm.instructions,
              isActive: channelForm.isActive,
            }
          : c
      );
      const newSettings = { ...settings, paymentChannels: updatedChannels };
      persistSettings(newSettings, `Updated ${channelForm.provider} channel`);
    } else {
      // Add new
      const newChan: PaymentChannel = {
        id: `pc-${Date.now()}`,
        provider: channelForm.provider,
        accountType: channelForm.accountType,
        accountNumber: channelForm.accountNumber,
        instructions: channelForm.instructions,
        isActive: channelForm.isActive,
      };
      const newSettings = {
        ...settings,
        paymentChannels: [...settings.paymentChannels, newChan],
      };
      persistSettings(newSettings, `Added ${channelForm.provider} ${channelForm.accountType} channel`);
    }

    setIsChannelModalOpen(false);
  };

  const handleDeleteChannel = (id: string) => {
    const updatedChannels = settings.paymentChannels.filter((c) => c.id !== id);
    const newSettings = {
      ...settings,
      paymentChannels: updatedChannels,
    };
    persistSettings(newSettings, "Payment channel removed");
  };

  const handleToggleChannelStatus = (id: string) => {
    const updatedChannels = settings.paymentChannels.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    const newSettings = {
      ...settings,
      paymentChannels: updatedChannels,
    };
    persistSettings(newSettings);
  };

  // ==========================================
  // POSTERS & SLIDERS MANAGEMENT
  // ==========================================
  const handleOpenAddPoster = () => {
    setEditingPoster(null);
    setPosterForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      actionText: "Enroll Now",
      actionUrl: "#courses",
      order: (settings.posters?.length || 0) + 1,
      isActive: true,
    });
    setIsPosterModalOpen(true);
  };

  const handleOpenEditPoster = (poster: PosterSlide) => {
    setEditingPoster(poster);
    setPosterForm({ ...poster });
    setIsPosterModalOpen(true);
  };

  const handleSavePoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterForm.title.trim()) {
      toast.error("Please enter a slide title");
      return;
    }
    if (!posterForm.imageUrl.trim()) {
      toast.error("Please upload or provide an image URL for the slide");
      return;
    }

    const currentPosters = settings.posters || [];

    if (editingPoster) {
      const updated = currentPosters.map((p) =>
        (p.id && p.id === editingPoster.id) || p.title === editingPoster.title
          ? { ...posterForm, id: editingPoster.id }
          : p
      );
      const newSettings = { ...settings, posters: updated };
      persistSettings(newSettings, "Poster slide updated");
    } else {
      const newSlide: PosterSlide = {
        ...posterForm,
        id: `poster-${Date.now()}`,
      };
      const newSettings = { ...settings, posters: [...currentPosters, newSlide] };
      persistSettings(newSettings, "New hero slide added");
    }

    setIsPosterModalOpen(false);
  };

  const handleDeletePoster = (idOrTitle: string) => {
    const updated = (settings.posters || []).filter(
      (p) => p.id !== idOrTitle && p.title !== idOrTitle
    );
    const newSettings = { ...settings, posters: updated };
    persistSettings(newSettings, "Hero slide removed");
  };

  const handleTogglePosterStatus = (idOrTitle: string) => {
    const updated = (settings.posters || []).map((p) =>
      p.id === idOrTitle || p.title === idOrTitle ? { ...p, isActive: !p.isActive } : p
    );
    const newSettings = { ...settings, posters: updated };
    persistSettings(newSettings);
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case "BKASH":
        return "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300 border-pink-300";
      case "NAGAD":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-300";
      case "ROCKET":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
        <span className="ml-2 text-xs font-semibold text-text-main">Loading settings...</span>
      </div>
    );
  }

  if (isBranchAdmin) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-surface border border-theme rounded-sm shadow-xs mt-12">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-sm flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-text-main">Super Administrator Access Required</h2>
        <p className="text-xs text-text-main/60">
          Organization profile settings, global merchant payment channels, and public landing posters can only be configured by central Super Administrators.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-theme pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-main flex items-center gap-2">
            <Building className="w-5 h-5 text-brand-primary" /> Organisation & Public Identity
          </h1>
          <p className="text-xs text-text-main/60 mt-0.5">
            Manage your coaching institute identity, hero slides, and official payment channels with instant edit controls.
          </p>
        </div>

        <button
          onClick={() => handleSaveSettings()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isSaving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "branding"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <Building className="w-3.5 h-3.5" /> Identity & Branding
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("posters")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "posters"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Hero Posters & Sliders ({settings.posters?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "payments"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Payment Channels ({settings.paymentChannels.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("branches")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "branches"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-text-main/60 hover:text-text-main"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Campus / Branches
        </button>
      </div>

      {/* TAB 1: BRANDING & CONTACT */}
      {activeTab === "branding" && (
        <div className="bg-surface border border-theme rounded-sm p-5 space-y-5">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-brand-primary" /> General Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Institute Legal Name *</label>
              <input
                type="text"
                required
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Tagline / Motto</label>
              <input
                type="text"
                value={settings.tagline || ""}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Official Support Phone</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-main/40" />
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Official Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-main/40" />
                <input
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">Established Year</label>
              <input
                type="text"
                placeholder="e.g. 2018"
                value={settings.establishedYear || ""}
                onChange={(e) => setSettings({ ...settings, establishedYear: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-main">WhatsApp Admission Helpline</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-emerald-600" />
                <input
                  type="text"
                  placeholder="e.g. +880 1711-111111"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Central Headquarters Location
                </label>
                <Link
                  to="/admin/branches"
                  className="text-[11px] font-semibold text-brand-primary hover:underline flex items-center gap-1"
                >
                  Manage Main Campus in Branches &rarr;
                </Link>
              </div>
              <div className="p-3 bg-bg-app border border-theme rounded-sm flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60 rounded-xs uppercase">
                      Synced from Main Branch
                    </span>
                    {settings.phone && (
                      <span className="text-[11px] font-mono text-text-main/70">
                        HQ Phone: {settings.phone}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-main font-medium">
                    {settings.address || "No central campus designated yet. Please mark a branch as the Main Campus in Branches Management."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-text-main">Official Website</label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-main/40" />
                <input
                  type="url"
                  value={settings.website || ""}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-theme grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUpload
              label="Institute Main Logo"
              folder="logos"
              value={settings.logoUrl || ""}
              onChange={(url) => setSettings({ ...settings, logoUrl: url })}
              helperText="Upload transparent PNG or SVG logo. Automatically saved to Supabase storage."
            />

            <FileUpload
              label="Favicon"
              folder="logos"
              value={settings.faviconUrl || ""}
              onChange={(url) => {
                const updated = { ...settings, faviconUrl: url };
                setSettings(updated);
                setDynamicFavicon(url, settings.name);
              }}
              helperText="Square 32x32 or 64x64 icon for browser tab."
            />
          </div>
        </div>
      )}

      {/* TAB 2: HERO POSTERS & SLIDERS */}
      {activeTab === "posters" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface border border-theme p-4 rounded-sm">
            <div>
              <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-primary" /> Landing Page Hero Posters & Slides
              </h2>
              <p className="text-xs text-text-main/60 mt-0.5">
                These slides will automatically rotate in the public landing page hero section with your custom call-to-action buttons.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddPoster}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Slide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!settings.posters || settings.posters.length === 0) && (
              <div className="md:col-span-2 text-center p-8 bg-surface border border-theme rounded-sm text-xs text-text-main/60">
                No hero slides created yet. Click "Add New Slide" to showcase your upcoming batches and promotions!
              </div>
            )}

            {settings.posters?.map((poster, idx) => (
              <div
                key={poster.id || idx}
                className="bg-surface border border-theme rounded-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 w-full bg-bg-app border-b border-theme">
                    <img
                      src={poster.imageUrl}
                      alt={poster.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-mono font-bold rounded-xs backdrop-blur-xs">
                      Slide #{poster.order || idx + 1}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-xs border ${
                          poster.isActive
                            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/60 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {poster.isActive ? "ACTIVE" : "HIDDEN"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h3 className="text-xs font-bold text-text-main line-clamp-1">{poster.title}</h3>
                    {poster.subtitle && (
                      <p className="text-[11px] text-text-main/70 line-clamp-2">{poster.subtitle}</p>
                    )}
                    {poster.actionText && (
                      <div className="pt-2 text-[10px] text-brand-primary font-bold flex items-center gap-1">
                        <span>Action: {poster.actionText}</span>
                        <span className="text-text-main/40 font-mono">({poster.actionUrl})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-bg-app border-t border-theme flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePosterStatus(poster.id || poster.title)}
                    className="text-[11px] font-semibold text-text-main/70 hover:text-text-main"
                  >
                    {poster.isActive ? "Hide from Hero" : "Show on Hero"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditPoster(poster)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-theme text-xs font-semibold text-text-main rounded-sm hover:border-brand-primary"
                    >
                      <Edit2 className="w-3 h-3 text-brand-primary" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePoster(poster.id || poster.title)}
                      className="p-1 text-text-main/50 hover:text-red-500 rounded-sm"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT CHANNELS */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface border border-theme p-4 rounded-sm">
            <div>
              <h2 className="text-sm font-bold text-text-main flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-primary" /> Official Financial Inflow Channels
              </h2>
              <p className="text-xs text-text-main/60 mt-0.5">
                These numbers will appear on student admission receipts, fee payment portals, and the public landing page banner.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddChannel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" /> Add Payment Channel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.paymentChannels.map((channel) => (
              <div
                key={channel.id}
                className={`bg-surface border rounded-sm p-4 space-y-3 transition-colors ${
                  channel.isActive ? "border-theme" : "border-theme/40 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 border rounded-xs ${getProviderBadgeColor(
                        channel.provider
                      )}`}
                    >
                      {channel.provider}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-text-main/60 tracking-wider">
                      {channel.accountType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                        channel.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {channel.isActive ? "ACTIVE" : "DISABLED"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-main/50 font-mono">Account / Wallet Number</p>
                  <p className="text-base font-bold font-mono text-text-main tracking-wider">
                    {channel.accountNumber}
                  </p>
                </div>

                {channel.instructions && (
                  <div className="p-2 bg-bg-app border border-theme rounded-sm text-[11px] text-text-main/80">
                    <span className="font-semibold text-text-main">Note: </span>
                    {channel.instructions}
                  </div>
                )}

                <div className="pt-2 border-t border-theme flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleChannelStatus(channel.id)}
                    className="text-[11px] font-semibold text-text-main/70 hover:text-text-main"
                  >
                    {channel.isActive ? "Deactivate" : "Activate"}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditChannel(channel)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface border border-theme text-xs font-semibold text-text-main rounded-sm hover:border-brand-primary"
                    >
                      <Edit2 className="w-3 h-3 text-brand-primary" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(channel.id)}
                      className="p-1 text-text-main/40 hover:text-red-500 rounded-sm"
                      title="Remove Channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CAMPUS / BRANCHES */}
      {activeTab === "branches" && (
        <div className="bg-surface border border-theme rounded-sm p-4 sm:p-5 space-y-4">
          <BranchesManagement embedded={true} />
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT PAYMENT CHANNEL */}
      {/* ========================================== */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-theme w-full max-w-md rounded-sm shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-primary" />
                {editingChannel ? "Edit Payment Channel" : "Add Payment Channel"}
              </h3>
              <button
                onClick={() => setIsChannelModalOpen(false)}
                className="text-text-main/40 hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Provider *</label>
                  <select
                    value={channelForm.provider}
                    onChange={(e: any) => setChannelForm({ ...channelForm, provider: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="UPAY">Upay</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Account Type *</label>
                  <select
                    value={channelForm.accountType}
                    onChange={(e: any) => setChannelForm({ ...channelForm, accountType: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="MERCHANT">Merchant Account</option>
                    <option value="PERSONAL">Personal Number</option>
                    <option value="AGENT">Agent Account</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Account / Wallet Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01700-112233"
                  value={channelForm.accountNumber}
                  onChange={(e) => setChannelForm({ ...channelForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Payment Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Use Make Payment and give Student Roll as Reference"
                  value={channelForm.instructions}
                  onChange={(e) => setChannelForm({ ...channelForm, instructions: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chanActive"
                  checked={channelForm.isActive}
                  onChange={(e) => setChannelForm({ ...channelForm, isActive: e.target.checked })}
                  className="rounded-xs"
                />
                <label htmlFor="chanActive" className="text-xs font-semibold text-text-main cursor-pointer">
                  Channel Active for Public / Student Portal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  {editingChannel ? "Save Channel Changes" : "Add Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD / EDIT HERO POSTER SLIDE */}
      {/* ========================================== */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface border border-theme w-full max-w-lg rounded-sm shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-theme pb-3">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-primary" />
                {editingPoster ? "Edit Hero Slide" : "Add Hero Slide"}
              </h3>
              <button
                onClick={() => setIsPosterModalOpen(false)}
                className="text-text-main/40 hover:text-text-main"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePoster} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Slide Title (Hero Heading) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical & Engineering Admission 2026 Batch"
                  value={posterForm.title}
                  onChange={(e) => setPosterForm({ ...posterForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-main">Slide Subtitle / One-Line Description</label>
                <input
                  type="text"
                  placeholder="e.g. Top mentors, weekly mock tests, and offline classes in Dhanmondi & Uttara."
                  value={posterForm.subtitle || ""}
                  onChange={(e) => setPosterForm({ ...posterForm, subtitle: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <FileUpload
                label="Poster / Banner Image *"
                folder="posters"
                value={posterForm.imageUrl}
                onChange={(url) => setPosterForm({ ...posterForm, imageUrl: url })}
                helperText="Upload 16:9 or 1920x1080 banner image. Uploaded directly to Supabase storage."
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Enroll Now"
                    value={posterForm.actionText || ""}
                    onChange={(e) => setPosterForm({ ...posterForm, actionText: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Button Target Link</label>
                  <input
                    type="text"
                    placeholder="e.g. #courses or /register"
                    value={posterForm.actionUrl || ""}
                    onChange={(e) => setPosterForm({ ...posterForm, actionUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-main">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={posterForm.order}
                    onChange={(e) => setPosterForm({ ...posterForm, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-1.5 text-xs bg-bg-app border border-theme rounded-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="slideActive"
                    checked={posterForm.isActive}
                    onChange={(e) => setPosterForm({ ...posterForm, isActive: e.target.checked })}
                    className="rounded-xs"
                  />
                  <label htmlFor="slideActive" className="text-xs font-semibold text-text-main cursor-pointer">
                    Active on Landing Page
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsPosterModalOpen(false)}
                  className="px-3 py-1.5 border border-theme text-xs font-semibold rounded-sm hover:bg-bg-app"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-sm hover:opacity-90 shadow-xs"
                >
                  {editingPoster ? "Save Slide Changes" : "Add Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
