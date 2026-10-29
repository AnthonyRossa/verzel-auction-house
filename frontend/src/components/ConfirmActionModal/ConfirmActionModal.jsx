import { useState } from "react";
import "./ConfirmActionModal.css";

export default function ConfirmActionModal({
  title,
  message,
  confirmText,
  onConfirm,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setError("");
    setLoading(true);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || "The action failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) onClose();
  }

  return (
    <div className="confirm-modal__overlay" onMouseDown={handleClose}>
      <section
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="confirm-modal__close"
          type="button"
          onClick={handleClose}
          disabled={loading}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="confirm-modal-title">{title}</h2>
        <p>{message}</p>

        {error && <p className="confirm-modal__error" role="alert">{error}</p>}

        <div className="confirm-modal__actions">
          <button type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="confirm-modal__confirm"
            type="button"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}