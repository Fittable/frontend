"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.login({ student_id: studentId, password });
      router.push("/calendar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Background decoration */}
      <div className={styles.bgPattern} />
      
      <div className={styles.card}>
        {/* Logo/Icon */}
        <div className={styles.logoWrapper}>
          <div className={styles.logo}>
            <CalendarIcon />
          </div>
        </div>

        <h1 className={styles.title}>Part-time Scheduler</h1>
        <p className={styles.subtitle}>Sign in to manage your shifts</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Student ID</label>
            <div className={styles.inputWrapper}>
              <UserIcon />
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={styles.input}
                placeholder="Enter your student ID"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <LockIcon />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <ErrorIcon />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>Demo credentials</span>
        </div>

        <div className={styles.hints}>
          <div className={styles.hint}>
            <span className={styles.hintRole}>Admin:</span>
            <code>admin / admin1234</code>
          </div>
          <div className={styles.hint}>
            <span className={styles.hintRole}>Worker:</span>
            <code>worker1 / worker1234</code>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>Part-time Work Scheduler</span>
      </footer>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className={styles.spinner} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
