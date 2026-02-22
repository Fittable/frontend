"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import html2canvas from "html2canvas";
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

/** Minimal profile data for showing settings without an API call (사무실, 닉네임, 대학 only). */
export type InitialSettingsData = Pick<ProfileSettings, "room_no" | "nickname" | "dept_name">;

interface ProfileCardProps {
  language: Language;
  onClose: () => void;
  onProfileUpdated?: (profile: ProfileSettings) => void;
  onLanguageChange?: (lang: Language) => void;
  displayNamePreference?: DisplayNamePreference;
  onDisplayNamePreferenceChange?: (pref: DisplayNamePreference) => void;
  /** When provided, settings open without an API call; only 사무실, 닉네임, 대학, 언어, 캘린더 are shown until "View profile" is clicked. */
  initialSettings?: InitialSettingsData | null;
  /** Display name and initial for the name row when in quick-settings view (프로필 보기 button is shown beside this). */
  userDisplayName?: string | null;
  userInitial?: string;
}

export default function ProfileCard({
  language,
  onClose,
  onProfileUpdated,
  onLanguageChange,
  displayNamePreference = "nickname",
  onDisplayNamePreferenceChange,
  initialSettings,
  userDisplayName,
  userInitial = "?",
}: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [loading, setLoading] = useState(!initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [loadingFullProfile, setLoadingFullProfile] = useState(false);
  const [showIdCardPopup, setShowIdCardPopup] = useState(false);
  const idCardRef = useRef<HTMLDivElement>(null);

  const [roomNo, setRoomNo] = useState(initialSettings?.room_no ?? "");
  const [nickname, setNickname] = useState(initialSettings?.nickname ?? "");
  const [deptName, setDeptName] = useState(initialSettings?.dept_name ?? "");
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

  const loadFullProfile = useCallback(async () => {
    setLoadingFullProfile(true);
    setError(null);
    try {
      const data = await api.getProfileSettings();
      setProfile(data);
      setRoomNo(data.room_no ?? "");
      setNickname(data.nickname ?? "");
      setDeptName(data.dept_name ?? "");
      setWorkCategory(data.work_category === "일반" || data.work_category === "신규" ? data.work_category : WORK_CATEGORY_DEFAULT);
      setShowIdCardPopup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoadingFullProfile(false);
    }
  }, []);

  useEffect(() => {
    if (initialSettings != null) {
      setRoomNo(initialSettings.room_no ?? "");
      setNickname(initialSettings.nickname ?? "");
      setDeptName(initialSettings.dept_name ?? "");
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [fetchProfile, initialSettings]);

  const handleSave = async () => {
    if (showSettingsOnly && !profile) {
      setSaving(true);
      setSaveError(null);
      const payload: ProfileSettingsUpdate = {
        room_no: roomNo?.trim() || null,
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
      return;
    }
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

  const handleDownloadIdCard = useCallback(async () => {
    const el = idCardRef.current;
    if (!el) return;
    const safeName = (profile?.name ?? "student").replace(/[/\\:*?"<>|]/g, "").trim() || "student";
    const filename = `${safeName} 근로학생증.png`;
    try {
      const scale = Math.min(4, Math.max(3, typeof window !== "undefined" ? window.devicePixelRatio || 2 : 3));
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      // ignore capture errors
    }
  }, [profile?.name]);

  const showSettingsOnly = initialSettings != null && !showFullProfile;

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

  if (error && !showSettingsOnly) {
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
          {showSettingsOnly ? (
            <div className={styles.avatarRow}>
              <div className={styles.avatar}>
                <span className={styles.avatarLetter}>
                  {(userInitial || "?").charAt(0).toUpperCase()}
                </span>
                <img
                  src="/default-avatar.png"
                  alt=""
                  className={styles.avatarImg}
                />
              </div>
              <div className={styles.nameBlock}>
                <div className={styles.row} style={{ flex: 1, marginBottom: 0 }}>
                  <span className={styles.label}>{t(language, "profile.displayName")}</span>
                  <span className={styles.value}>{userDisplayName ?? "—"}</span>
                </div>
                <button
                  type="button"
                  className={styles.viewProfileBtnInline}
                  onClick={loadFullProfile}
                  disabled={loadingFullProfile}
                >
                  {loadingFullProfile ? t(language, "profile.loading") : t(language, "profile.viewProfile")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.row} style={{ marginTop: 0 }}>
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
            </>
          )}

          {showSettingsOnly && error && <div className={styles.error} style={{ marginTop: 12 }}>{error}</div>}

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
              placeholder={profile?.name?.charAt(0) || userDisplayName?.charAt(0) || t(language, "profile.nickname")}
            />
          </div>

          {(onLanguageChange || onDisplayNamePreferenceChange) && (
            <div className={styles.togglesRow}>
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

      {showIdCardPopup && profile && (
        <>
          <div
            className={styles.idCardPopupOverlay}
            onClick={() => setShowIdCardPopup(false)}
            aria-hidden
          />
          <div className={styles.idCardPopupCard} role="dialog" aria-label={t(language, "profile.studentIdCard")}>
            <div className={styles.idCardPopupActions}>
              <button
                type="button"
                className={styles.idCardPopupDownload}
                onClick={handleDownloadIdCard}
                aria-label={t(language, "profile.download")}
              >
                <DownloadIcon />
              </button>
              <button
                type="button"
                className={styles.idCardPopupClose}
                onClick={() => setShowIdCardPopup(false)}
                aria-label={t(language, "profile.close")}
              >
                <CloseIcon />
              </button>
            </div>
            <TiltedCard className={styles.idCardTiltWrap}>
              <StudentIdCard profile={profile} language={language} idCardRef={idCardRef} />
            </TiltedCard>
          </div>
        </>
      )}
    </>
  );
}

const TILT_MAX = 12;
const TILT_SCALE = 1.02;

function TiltedCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [gloss, setGloss] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const xNorm = (e.clientX - centerX) / (rect.width / 2);
      const yNorm = (e.clientY - centerY) / (rect.height / 2);
      setTilt({
        x: Math.max(-1, Math.min(1, yNorm)) * -TILT_MAX,
        y: Math.max(-1, Math.min(1, xNorm)) * TILT_MAX,
      });
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      setGloss({ x: xPct, y: yPct });
      setIsHovered(true);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGloss(null);
    setIsHovered(false);
  }, []);

  const scale = isHovered ? TILT_SCALE : 1;
  const transform = `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${scale}, ${scale}, ${scale})`;

  const glossStyle: React.CSSProperties =
    gloss != null
      ? {
          background: `radial-gradient(circle at ${gloss.x}% ${gloss.y}%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, transparent 75%)`,
          opacity: 1,
        }
      : { opacity: 0 };

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1000px" }}
    >
      <div
        style={{
          transform,
          transition: "transform 0.1s ease-out",
          transformStyle: "preserve-3d",
          position: "relative",
          display: "inline-block",
        }}
      >
        {children}
        <div
          className={styles.idCardGloss}
          style={glossStyle}
          aria-hidden
        />
      </div>
    </div>
  );
}

function StudentIdCard({
  profile,
  language,
  idCardRef,
}: {
  profile: ProfileSettings | null;
  language: Language;
  idCardRef?: React.RefObject<HTMLDivElement>;
}) {
  const [photoError, setPhotoError] = useState(false);
  const initial = (profile?.name || profile?.student_id || "?").charAt(0).toUpperCase();

  return (
    <div ref={idCardRef} className={styles.idCard}>
      <div className={styles.idCardStripe}>
        <span className={styles.idCardStripeText}>{t(language, "profile.studentIdCard")}</span>
      </div>
      <div className={styles.idCardBody}>
        <div className={styles.idCardPhotoWrap}>
          {profile ? (photoError ? (
            <div className={styles.idCardPhotoPlaceholder}>{initial}</div>
          ) : (
            <img
              src="/api/profile/image"
              alt=""
              className={styles.idCardPhoto}
              onError={() => setPhotoError(true)}
            />
          )) : (
            <div className={styles.idCardPhotoPlaceholder}>?</div>
          )}
        </div>
        <div className={styles.idCardName}>{profile?.name ?? "—"}</div>
        <div className={styles.idCardBottomRow}>
          <div className={styles.idCardInfo}>
            <div className={styles.idCardRow}>
              <span className={styles.idCardLabel}>{t(language, "profile.studentId")}</span>
              <span className={styles.idCardValue}>{profile?.student_id ?? "—"}</span>
            </div>
            <div className={styles.idCardRow}>
              <span className={styles.idCardLabel}>{t(language, "profile.deptName")}</span>
              <span className={styles.idCardValue}>{profile?.dept_name ?? "—"}</span>
            </div>
            <div className={styles.idCardRow}>
              <span className={styles.idCardLabel}>{t(language, "profile.major")}</span>
              <span className={styles.idCardValue}>{profile?.major ?? "—"}</span>
            </div>
            <div className={styles.idCardRow}>
              <span className={styles.idCardLabel}>{t(language, "profile.dateOfBirth")}</span>
              <span className={styles.idCardValue}>{profile?.date_of_birth ?? "—"}</span>
            </div>
            <div className={styles.idCardRow}>
              <span className={styles.idCardLabel}>{t(language, "profile.gender")}</span>
              <span className={styles.idCardValue}>{profile?.gender ?? "—"}</span>
            </div>
            <div className={styles.idCardRow}>
              <span className={styles.idCardLabel}>{t(language, "profile.nationality")}</span>
              <span className={styles.idCardValue}>{profile?.nationality ?? "—"}</span>
            </div>
            <div className={styles.idCardRow}>
              <span className={styles.idCardLabel}>{t(language, "profile.roomNo")}</span>
              <span className={styles.idCardValue}>{profile?.room_no ?? "—"}</span>
            </div>
          </div>
          <div className={styles.idCardBodyMascot} aria-hidden />
        </div>
      </div>
      <div className={styles.idCardFooter}>
        <span className={styles.idCardIdDisplay}>{profile?.student_id ?? ""}</span>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
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
