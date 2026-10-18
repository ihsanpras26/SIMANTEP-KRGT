import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('[role="menuitem"]')?.focus();
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div
      ref={root}
      className="action-menu"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="btn-secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        Lainnya <ChevronDown size={14} />
      </button>
      {open && (
        <div
          id={id}
          ref={menu}
          role="menu"
          aria-label="Tindakan arsip lainnya"
          className="action-menu-panel"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              close();
            }
            const buttons = [
              ...menu.current.querySelectorAll('[role="menuitem"]'),
            ];
            const index = buttons.indexOf(document.activeElement);
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? buttons.length - 1
                    : (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        buttons.length) %
                      buttons.length;
              buttons[next]?.focus();
            }
          }}
        >
          {items.map(({ label, icon: Icon, onSelect }) => (
            <button
              type="button"
              role="menuitem"
              className="action-menu-item"
              key={label}
              onClick={() => {
                close();
                onSelect();
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
