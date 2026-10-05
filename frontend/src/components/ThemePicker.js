import React from "react";
import { useTheme } from "../ThemeContext";
import { useI18n } from "../LanguageContext";
import "../styles/ThemePicker.css";

export default function ThemePicker({ onSelect, className = "" }) {
  const { theme, setTheme, themes } = useTheme();
  const { language, t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  // Close the dropdown when clicking anywhere outside of it
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open ]);

  const pick = (id) => {
    setTheme(id);
    setOpen(false);
    if (onSelect) onSelect();
  };

  return (
    <div className={`theme-picker ${className}`} ref={wrapRef}>
      <button
        type="button"
        className="theme-picker-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("theme.chooseTheme")}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={t("theme.chooseTheme")}
      >
        🎨
      </button>
      {open && (
        <div className="theme-picker-menu" role="listbox" aria-label={t("theme.chooseTheme")}>
          <div className="theme-picker-heading">{t("theme.chooseTheme")}</div>
          {themes.map((th) => (
            <button
              key={th.id}
              type="button"
              role="option"
              aria-selected={th.id === theme}
              className={`theme-picker-option${th.id === theme ? " active" : ""}`}
              onClick={() => pick(th.id)}
            >
              <span
                className="theme-picker-swatch"
                style={{
                  background: `linear-gradient(135deg, ${th.swatch[0]} 50%, ${th.swatch[1]} 50%)`,
                }}
              />
              <span className="theme-picker-name">
                {language === "am" ? th.amName : th.name}
              </span>
              {th.id === theme && <span className="theme-picker-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
