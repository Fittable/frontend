"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { ProfileSettings, ProfileSettingsUpdate, DisplayNamePreference } from "@/lib/types";
import { t, Language } from "@/lib/i18n";
import styles from "./ProfileCard.module.css";

const ROOM_NO_OPTIONS = ["102호", "103호"] as const;

const WORK_CATEGORY_OPTIONS = ["일반", "신규"] as const;
const WORK_CATEGORY_DEFAULT: (typeof WORK_CATEGORY_OPTIONS)[number] = "일반";

const DEPT_NAME_OPTIONS = [
  "공과대학",
  "인문사회과학대학",
  "경영대학",
  "자연과학대학",
  "전자정보공과대학",
  "정책법학대학",
  "인제니움대학",
  "인공지능융합대학",
  "참빛인재대학",
] as const;

interface ProfileCardProps {
  language: Language;
  onClose: () => void;
  onProfileUpdated?: (profile: ProfileSettings) => void;
  onLanguageChange?: (lang: Language) => void;
  displayNamePreference?: DisplayNamePreference;
  onDisplayNamePreferenceChange?: (pref: DisplayNamePreference) => void;
}

export default function ProfileCard({
  language,
  onClose,
  onProfileUpdated,
  onLanguageChange,
  displayNamePreference = "nickname",
  onDisplayNamePreferenceChange,
}: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [roomNo, setRoomNo] = useState("");
  const [nickname, setNickname] = useState("");
  const [deptName, setDeptName] = useState("");
  const [workCategory, setWorkCategory] = useState(WORK_CATEGORY_DEFAULT);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProfileSettings();
      setProfile(data);
      setRoomNo(data.room_no ?? "");
      setNickname(data.nickname ?? "");
      setDeptName(data.dept_name ?? "");
      setWorkCategory(data.work_category === "일반" || data.work_category === "신규" ? data.work_category : WORK_CATEGORY_DEFAULT);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    const payload: ProfileSettingsUpdate = {
      room_no: roomNo?.trim() || null,
      // Use empty string to clear; some backends reject null for optional string fields
      nickname: nickname.trim() || "",
      dept_name: deptName?.trim() || null,
      work_category: workCategory || null,
    };
    try {
      const updated = await api.updateProfileSettings(payload);
      setProfile(updated);
      onProfileUpdated?.(updated);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (loading) {
    return (
      <>
        <div className={styles.overlay} onClick={handleOverlayClick} aria-hidden />
        <div className={styles.card} role="dialog" aria-label={t(language, "profile.settings")}>
          <div className={styles.loading}>{t(language, "profile.loading")}</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className={styles.overlay} onClick={handleOverlayClick} aria-hidden />
        <div className={styles.card} role="dialog" aria-label={t(language, "profile.settings")}>
          <div className={styles.header}>
            <h2 className={styles.title}>{t(language, "profile.settings")}</h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t(language, "profile.close")}>
              <CloseIcon />
            </button>
          </div>
          <div className={styles.error}>{error}</div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              {t(language, "profile.close")}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.overlay} onClick={handleOverlayClick} aria-hidden />
      <div className={styles.card} role="dialog" aria-label={t(language, "profile.settings")}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t(language, "profile.settings")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t(language, "profile.close")}>
            <CloseIcon />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.avatarRow}>
            <div className={styles.avatar}>
              {(profile?.name || profile?.student_id || "?").charAt(0).toUpperCase()}
            </div>
            <div className={styles.row} style={{ flex: 1 }}>
              <span className={styles.label}>{t(language, "profile.name")}</span>
              <span className={styles.value}>{profile?.name ?? "—"}</span>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.studentId")}</span>
            <span className={styles.value}>{profile?.student_id ?? "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.major")}</span>
            <span className={styles.value}>{profile?.major ?? "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.dateOfBirth")}</span>
            <span className={styles.value}>{profile?.date_of_birth ?? "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.gender")}</span>
            <span className={styles.value}>{profile?.gender ?? "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.nationality")}</span>
            <span className={styles.value}>{profile?.nationality ?? "—"}</span>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.roomNo")}</span>
            <select
              className={styles.select}
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value)}
              aria-label={t(language, "profile.roomNo")}
            >
              <option value="">—</option>
              {ROOM_NO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.nickname")}</span>
            <input
              type="text"
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t(language, "profile.nickname")}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.deptName")}</span>
            <select
              className={styles.select}
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              aria-label={t(language, "profile.deptName")}
            >
              <option value="">—</option>
              {DEPT_NAME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>{t(language, "profile.workCategory")}</span>
            <select
              className={styles.select}
              value={workCategory}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "일반" || v === "신규") setWorkCategory(v);
              }}
              aria-label={t(language, "profile.workCategory")}
            >
              {WORK_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {onLanguageChange && (
            <div className={styles.row}>
              <span className={styles.label}>{t(language, "profile.language")}</span>
              <div className={styles.langToggle} aria-label="Language">
                <button
                  type="button"
                  className={`${styles.langButton} ${language === "ko" ? styles.langButtonActive : ""}`}
                  onClick={() => onLanguageChange("ko")}
                >
                  한
                </button>
                <button
                  type="button"
                  className={`${styles.langButton} ${language === "en" ? styles.langButtonActive : ""}`}
                  onClick={() => onLanguageChange("en")}
                >
                  En
                </button>
              </div>
            </div>
          )}

          {onDisplayNamePreferenceChange && (
            <div className={styles.row}>
              <span className={styles.label}>{t(language, "profile.displayNamePreference")}</span>
              <div className={styles.langToggle} aria-label="Display name preference">
                <button
                  type="button"
                  className={`${styles.langButton} ${displayNamePreference === "nickname" ? styles.langButtonActive : ""}`}
                  onClick={() => onDisplayNamePreferenceChange("nickname")}
                >
                  {t(language, "profile.displayNickname")}
                </button>
                <button
                  type="button"
                  className={`${styles.langButton} ${displayNamePreference === "fullName" ? styles.langButtonActive : ""}`}
                  onClick={() => onDisplayNamePreferenceChange("fullName")}
                >
                  {t(language, "profile.displayFullName")}
                </button>
              </div>
            </div>
          )}

          {saveError && <div className={styles.error} style={{ marginTop: 12 }}>{saveError}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={saving}>
              {t(language, "profile.close")}
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t(language, "profile.saving") : t(language, "profile.save")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
