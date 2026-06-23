import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, ImageIcon, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import type { AppLanguage, RedactionRule } from "@/types";
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
        <span className="loading loading-spinner loading-lg" aria-label={t("common.loading")} />
      </main>
    );
  }

  const aiEnabled = Boolean(settings.openRouterApiKey.trim());

  return (
    <main className="app-shell min-h-screen">
      <header className="border-b border-base-300 bg-base-100/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button className="btn btn-ghost gap-2" onClick={() => navigateTo("/")}>
            <ArrowLeft size={18} />
            {t("common.dashboard")}
          </button>
          <button className="btn btn-outline btn-sm gap-2" onClick={() => void handleBackup()}>
            <Download size={16} />
            {t("common.backup")}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">{t("settings.title")}</h1>

        {error && (
          <div role="alert" className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div role="alert" className="alert alert-success mb-4">
            <span>{success}</span>
          </div>
        )}

        {/* Display name */}
        <section className="mb-6 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">{t("settings.displayName")}</h2>
          <form onSubmit={handleUpdateName} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder={t("settings.displayNamePlaceholder")}
              className="input input-bordered flex-1"
              disabled={updating}
              maxLength={50}
            />
            <button
              type="submit"
              disabled={
                updating || newName.trim().toLowerCase() === profile?.displayName.toLowerCase()
              }
              className="btn btn-primary gap-2"
            >
              {updating ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Pencil size={16} />
              )}
              {updating ? t("common.saving") : t("common.update")}
            </button>
          </form>
        </section>

        {/* Language */}
        <section className="mb-6 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">{t("settings.language")}</h2>
          <p className="mb-3 text-sm text-base-content/60">{t("settings.languageDesc")}</p>
          <select
            className="select select-bordered w-full sm:max-w-xs"
            value={settings.language}
            onChange={(event) => void update({ language: event.target.value as AppLanguage })}
          >
            <option value="en">{t("settings.languageEnglish")}</option>
            <option value="de">{t("settings.languageGerman")}</option>
          </select>
        </section>

        {/* Company logo */}
        <section className="mb-6 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <ImageIcon size={18} className="text-primary" />
            {t("settings.logo")}
          </h2>
          <p className="mb-4 text-sm text-base-content/60">{t("settings.logoDesc")}</p>
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
                className="h-16 max-w-[200px] rounded border border-base-300 bg-base-200 object-contain p-2"
              />
            ) : (
              <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed border-base-300 text-base-content/40">
                <ImageIcon size={24} />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => logoInputRef.current?.click()}
              >
                {settings.logo ? t("settings.replaceLogo") : t("settings.uploadLogo")}
              </button>
              {settings.logo && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-error"
                  onClick={() => void update({ logo: "" })}
                >
                  {t("settings.removeLogo")}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* AI assistance */}
        <section className="mb-6 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <Sparkles size={18} className="text-primary" />
            {t("settings.ai")}
          </h2>
          <p className="mb-4 text-sm text-base-content/60">{t("settings.aiDesc")}</p>

          <div className="mb-4">
            <label className="label">
              <span className="label-text font-semibold">{t("settings.apiKey")}</span>
            </label>
            <input
              type="password"
              autoComplete="off"
              value={settings.openRouterApiKey}
              onChange={(event) => void update({ openRouterApiKey: event.target.value })}
              placeholder="sk-or-..."
              className="input input-bordered w-full"
            />
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="link link-primary mt-1 inline-block text-xs"
            >
              {t("settings.getKey")}
            </a>
          </div>

          <div className="mb-3">
            <label className="label">
              <span className="label-text font-semibold">{t("settings.model")}</span>
            </label>
            <input
              type="text"
              value={settings.openRouterModel}
              onChange={(event) => void update({ openRouterModel: event.target.value })}
              placeholder="openai/gpt-4o-mini"
              className="input input-bordered w-full"
            />
            <p className="mt-1 text-xs text-base-content/50">{t("settings.modelHint")}</p>
          </div>

          <div
            className={`alert ${aiEnabled ? "alert-success" : "alert-info"} mt-2`}
            role="status"
          >
            <span>{aiEnabled ? t("settings.aiEnabled") : t("settings.aiDisabled")}</span>
          </div>
        </section>

        {/* Redaction rules */}
        <section className="mb-6 rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">{t("redaction.title")}</h2>
          <p className="mb-4 text-sm text-base-content/60">{t("redaction.desc")}</p>

          {settings.redactionRules.length === 0 ? (
            <p className="mb-4 text-sm text-base-content/50">{t("redaction.empty")}</p>
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
                    className="input input-bordered flex-1"
                  />
                  <span className="hidden text-base-content/40 sm:inline">→</span>
                  <input
                    type="text"
                    value={rule.placeholder}
                    onChange={(event) => updateRule(rule.id, { placeholder: event.target.value })}
                    placeholder={t("redaction.placeholderPlaceholder")}
                    aria-label={t("redaction.placeholder")}
                    className="input input-bordered flex-1"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm text-error"
                    onClick={() => removeRule(rule.id)}
                    title={t("common.remove")}
                    aria-label={t("common.remove")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="btn btn-outline btn-sm gap-2" onClick={addRule}>
            <Plus size={16} />
            {t("redaction.add")}
          </button>
        </section>

        {/* Local data */}
        <section className="rounded-lg border border-error/30 bg-base-100 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-error">{t("settings.localData")}</h2>
              <p className="text-sm text-base-content/60">{t("settings.localDataDesc")}</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-error btn-outline gap-2"
            >
              <Trash2 size={16} />
              {t("settings.clearData")}
            </button>
          </div>
        </section>
      </section>

      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box rounded-lg">
            <h3 className="text-lg font-bold">{t("settings.clearConfirmTitle")}</h3>
            <p className="py-4">{t("settings.clearConfirmBody")}</p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                {t("common.cancel")}
              </button>
              <button
                className="btn btn-error gap-2"
                onClick={() => void handleDeleteAll()}
                disabled={deleting}
              >
                {deleting && <span className="loading loading-spinner loading-sm" />}
                {deleting ? t("settings.clearing") : t("settings.clearData")}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteConfirm(false)}>{t("common.close")}</button>
          </form>
        </div>
      )}
    </main>
  );
}
