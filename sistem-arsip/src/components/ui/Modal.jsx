import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { dialogStack, focusableElements, lockBodyScroll } from "./dialogState";

const DialogContext = createContext({});

function Modal({
  isOpen,
  onClose,
  children,
  className,
  size = "default",
  initialFocusRef,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
}) {
  const id = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    const previousFocus = document.activeElement;
    const releaseScroll = lockBodyScroll();
    const entry = { id, panel };
    dialogStack.push(entry);
    const isTop = () => dialogStack.at(-1) === entry;
    const focusFirst = () =>
      (
        initialFocusRef?.current ||
        panel.querySelector("[data-autofocus]") ||
        focusableElements(panel)[0] ||
        panel
      ).focus();
    const frame = requestAnimationFrame(focusFirst);
    const handleKey = (event) => {
      if (!isTop() || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
      }
      if (event.key === "Tab") {
        const controls = focusableElements(panel);
        if (!controls.length) {
          event.preventDefault();
          panel.focus();
          return;
        }
        const first = controls[0],
          last = controls.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === panel)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !panel.contains(document.activeElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const containFocus = (event) => {
      if (isTop() && !panel.contains(event.target)) focusFirst();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", containFocus);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", containFocus);
      const wasTop = isTop();
      const index = dialogStack.indexOf(entry);
      if (index >= 0) dialogStack.splice(index, 1);
      releaseScroll();
      if (
        wasTop &&
        previousFocus?.isConnected &&
        (!dialogStack.length ||
          dialogStack.at(-1).panel.contains(previousFocus))
      )
        previousFocus.focus();
    };
  }, [isOpen, id, initialFocusRef]);

  if (!isOpen) return null;
  return createPortal(
    <DialogContext.Provider
      value={{ titleId: `${id}-title`, descriptionId: `${id}-description` }}
    >
      <div
        className="dialog-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel || "Dialog"}
          aria-labelledby={
            labelledBy || (!ariaLabel ? `${id}-title` : undefined)
          }
          aria-describedby={describedBy}
          tabIndex={-1}
          className={cn("dialog-panel", `dialog-size-${size}`, className)}
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>,
    document.body,
  );
}

function ModalHeader({ children, className, onClose }) {
  return (
    <div className={cn("dialog-header", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Tutup dialog"
        >
          <X size={19} />
        </button>
      )}
    </div>
  );
}
function ModalTitle({ children, className, id, ...props }) {
  const { titleId } = useContext(DialogContext);
  return (
    <h2 id={id || titleId} className={cn("dialog-title", className)} {...props}>
      {children}
    </h2>
  );
}
function ModalDescription({ children, className, id, ...props }) {
  const { descriptionId } = useContext(DialogContext);
  return (
    <p
      id={id || descriptionId}
      className={cn("dialog-description", className)}
      {...props}
    >
      {children}
    </p>
  );
}
function ModalContent({ children, className, ...props }) {
  return (
    <div className={cn("dialog-content", className)} {...props}>
      {children}
    </div>
  );
}
function ModalFooter({ children, className, ...props }) {
  return (
    <div className={cn("dialog-footer", className)} {...props}>
      {children}
    </div>
  );
}
export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
};
