import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type, exiting: false }]);
    setTimeout(() => {
      // Start exit animation
      setToasts(t => t.map(toast => toast.id === id ? { ...toast, exiting: true } : toast));
      setTimeout(() => setToasts(t => t.filter(toast => toast.id !== id)), 280);
    }, duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(t => t.map(toast => toast.id === id ? { ...toast, exiting: true } : toast));
    setTimeout(() => setToasts(t => t.filter(toast => toast.id !== id)), 280);
  }, []);

  const success = useCallback((msg, dur) => show(msg, "success", dur), [show]);
  const error   = useCallback((msg, dur) => show(msg, "error",   dur || 6000), [show]);
  const info    = useCallback((msg, dur) => show(msg, "info",    dur), [show]);
  const warning = useCallback((msg, dur) => show(msg, "warning", dur), [show]);

  const ICONS = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning, dismiss }}>
      {children}
      <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast--${toast.type}${toast.exiting ? " toast--exit" : ""}`}
            onClick={() => dismiss(toast.id)}
            role="alert"
          >
            <span className="toast-icon">{ICONS[toast.type]}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }} aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
