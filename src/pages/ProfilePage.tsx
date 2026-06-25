import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, ImageIcon, Loader2, Palette, Pencil, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import type { AppLanguage, RedactionRule } from "@/types";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/settingsDefaults";
import { backupFilename, downloadJson } from "@/lib/files";
import { navigateTo } from "@/lib/navigation";
import { createId } from "@/lib/reportFactory";
import { useSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";
import {
  clearLocalData,
  exportSnapshot,
  getProfile,
  renameReportAuthor,
  saveProfile,
  type LocalProfile,
} from "@/lib/storage";

export default function ProfilePage() {
  const t = useT();
  const { settings, update } = useSettings();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const storedProfile = await getProfile();
      setProfile(storedProfile);
      setNewName(storedProfile.displayName);
      setLoading(false);
    };

    void loadProfile();
  }, []);

  const handleUpdateName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = newName.trim();
    if (!profile) {
      return;
    }
    if (!trimmed) {
      setError(t("settings.nameEmpty"));
      return;
    }
    if (trimmed.length > 50) {
      setError(t("settings.nameTooLong"));
      return;
    }
    if (trimmed.toLowerCase() === profile.displayName.toLowerCase()) {
      setError(t("settings.nameUnchanged"));
      return;
    }

    setUpdating(true);
    try {
      const updatedProfile = await saveProfile({
        displayName: trimmed,
        updatedAt: new Date().toISOString(),
      });
      await renameReportAuthor(profile.displayName, updatedProfile.displayName);
      setProfile(updatedProfile);
      setNewName(updatedProfile.displayName);
      setSuccess(t("settings.profileUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.profileUpdateFailed"));
    } finally {
      setUpdating(false);
    }
  };

  const handleBackup = async () => {
    downloadJson(backupFilename(), await exportSnapshot());
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await clearLocalData();
      setShowDeleteConfirm(false);
      navigateTo("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.clearDataFailed"));
      setDeleting(false);
    }
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > 1_000_000) {
      setError(t("settings.logoTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      void update({ logo: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const updateRule = (id: string, patch: Partial<RedactionRule>) => {
    void update({
      redactionRules: settings.redactionRules.map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule,
      ),
    });
  };

  const addRule = () => {
    void update({
      redactionRules: [
        ...settings.redactionRules,
        { id: createId("redact"), keyword: "", placeholder: "" },
      ],
    });
  };

  const removeRule = (id: string) => {
    void update({
      redactionRules: settings.redactionRules.filter((rule) => rule.id !== id),
    });
  };

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  const aiEnabled = Boolean(settings.openRouterApiKey.trim());

  return (
    <main className="app-shell min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button className="cbr-btn cbr-btn-ghost" onClick={() => navigateTo("/")}>
            <ArrowLeft size={16} />
            {t("common.dashboard")}
          </button>
          <button className="cbr-btn cbr-btn-outline cbr-btn-sm" onClick={() => void handleBackup()}>
            <Download size={14} />
            {t("common.backup")}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">{t("settings.title")}</h1>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div role="alert" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Display name */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">{t("settings.displayName")}</h2>
          <form onSubmit={handleUpdateName} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t("settings.displayNamePlaceholder")}
              className="form-input flex-1"
              disabled={updating}
              maxLength={50}
            />
            <button
              type="submit"
              disabled={
                updating || newName.trim().toLowerCase() === profile?.displayName.toLowerCase()
              }
              className="cbr-btn cbr-btn-primary"
            >
              {updating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Pencil size={14} />
              )}
              {updating ? t("common.saving") : t("common.update")}
            </button>
          </form>
        </section>

        {/* Language */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">{t("settings.language")}</h2>
          <p className="mb-3 text-sm text-slate-500">{t("settings.languageDesc")}</p>
          <select
            className="form-input w-full sm:max-w-xs"
            value={settings.language}
            onChange={(event) => void update({ language: event.target.value as AppLanguage })}
          >
            <option value="en">{t("settings.languageEnglish")}</option>
            <option value="de">{t("settings.languageGerman")}</option>
          </select>
        </section>

        {/* Company logo */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
            <ImageIcon size={16} className="text-primary" />
            {t("settings.logo")}
          </h2>
          <p className="mb-4 text-sm text-slate-500">{t("settings.logoDesc")}</p>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
          <div className="flex flex-wrap items-center gap-4">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="h-16 max-w-[200px] rounded-lg border border-slate-200 bg-slate-50 object-contain p-2"
              />
            ) : (
              <div className="flex h-16 w-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-slate-300">
                <ImageIcon size={24} />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="cbr-btn cbr-btn-outline cbr-btn-sm"
                onClick={() => logoInputRef.current?.click()}
              >
                {settings.logo ? t("settings.replaceLogo") : t("settings.uploadLogo")}
              </button>
              {settings.logo && (
                <button
                  type="button"
                  className="cbr-btn cbr-btn-ghost cbr-btn-sm text-red-500"
                  onClick={() => void update({ logo: "" })}
                >
                  {t("settings.removeLogo")}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Primary color */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Palette size={16} className="text-primary" />
            {t("settings.primaryColor")}
          </h2>
          <p className="mb-4 text-sm text-slate-500">{t("settings.primaryColorDesc")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={settings.primaryColor || DEFAULT_PRIMARY_COLOR}
                onChange={(e) => void update({ primaryColor: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 shadow-sm"
                style={{ backgroundColor: settings.primaryColor || DEFAULT_PRIMARY_COLOR }}
              />
            </label>
            <span className="font-mono text-sm text-slate-500">
              {(settings.primaryColor || DEFAULT_PRIMARY_COLOR).toUpperCase()}
            </span>
            {settings.primaryColor && settings.primaryColor !== DEFAULT_PRIMARY_COLOR && (
              <button
                type="button"
                className="cbr-btn cbr-btn-ghost cbr-btn-sm"
                onClick={() => void update({ primaryColor: DEFAULT_PRIMARY_COLOR })}
              >
                <RotateCcw size={14} />
                {t("settings.resetColor")}
              </button>
            )}
          </div>
        </section>

        {/* AI assistance */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Sparkles size={16} className="text-primary" />
            {t("settings.ai")}
          </h2>
          <p className="mb-4 text-sm text-slate-500">{t("settings.aiDesc")}</p>

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("settings.apiKey")}
            </label>
            <input
              type="password"
              autoComplete="off"
              value={settings.openRouterApiKey}
              onChange={(event) => void update({ openRouterApiKey: event.target.value })}
              placeholder="sk-or-..."
              className="form-input"
            />
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-primary underline hover:no-underline"
            >
              {t("settings.getKey")}
            </a>
          </div>

          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("settings.model")}
            </label>
            <input
              type="text"
              value={settings.openRouterModel}
              onChange={(event) => void update({ openRouterModel: event.target.value })}
              placeholder="openai/gpt-4o-mini"
              className="form-input"
            />
            <p className="mt-1 text-xs text-slate-400">{t("settings.modelHint")}</p>
          </div>

          <div
            className={`mt-2 rounded-lg border p-3 text-sm ${
              aiEnabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
            role="status"
          >
            {aiEnabled ? t("settings.aiEnabled") : t("settings.aiDisabled")}
          </div>
        </section>

        {/* Redaction rules */}
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-slate-900">{t("redaction.title")}</h2>
          <p className="mb-4 text-sm text-slate-500">{t("redaction.desc")}</p>

          {settings.redactionRules.length === 0 ? (
            <p className="mb-4 text-sm text-slate-400">{t("redaction.empty")}</p>
          ) : (
            <div className="mb-4 flex flex-col gap-2">
              {settings.redactionRules.map((rule) => (
                <div key={rule.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={rule.keyword}
                    onChange={(event) => updateRule(rule.id, { keyword: event.target.value })}
                    placeholder={t("redaction.keywordPlaceholder")}
                    aria-label={t("redaction.keyword")}
                    className="form-input flex-1"
                  />
                  <span className="hidden text-slate-300 sm:inline">&rarr;</span>
                  <input
                    type="text"
                    value={rule.placeholder}
                    onChange={(event) => updateRule(rule.id, { placeholder: event.target.value })}
                    placeholder={t("redaction.placeholderPlaceholder")}
                    aria-label={t("redaction.placeholder")}
                    className="form-input flex-1"
                  />
                  <button
                    type="button"
                    className="cbr-btn cbr-btn-ghost cbr-btn-sm cbr-btn-icon text-red-500"
                    onClick={() => removeRule(rule.id)}
                    title={t("common.remove")}
                    aria-label={t("common.remove")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="cbr-btn cbr-btn-outline cbr-btn-sm" onClick={addRule}>
            <Plus size={14} />
            {t("redaction.add")}
          </button>
        </section>

        {/* Local data */}
        <section className="rounded-xl border border-red-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-red-600">{t("settings.localData")}</h2>
              <p className="text-sm text-slate-500">{t("settings.localDataDesc")}</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="cbr-btn cbr-btn-danger"
            >
              <Trash2 size={14} />
              {t("settings.clearData")}
            </button>
          </div>
        </section>
      </section>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">{t("settings.clearConfirmTitle")}</h3>
            <p className="py-4 text-sm text-slate-600">{t("settings.clearConfirmBody")}</p>
            <div className="flex justify-end gap-2">
              <button
                className="cbr-btn cbr-btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                {t("common.cancel")}
              </button>
              <button
                className="cbr-btn cbr-btn-danger"
                onClick={() => void handleDeleteAll()}
                disabled={deleting}
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                {deleting ? t("settings.clearing") : t("settings.clearData")}
              </button>
            </div>
          </div>
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setShowDeleteConfirm(false)}
          />
        </div>
      )}
    </main>
  );
}
