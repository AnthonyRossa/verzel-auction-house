import { useContext, useState } from "react";
import api from "../../utils/api";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import "./DeleteAuction.css";

export default function DeleteAuction({ auction, onClose, onDeleted }) {
  const { token } = useContext(CurrentUserContext);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setDeleting(true);

    try {
      await api.deleteAuction(auction.id, token);
      onClose();
      onDeleted();
    } catch (err) {
      setError(err.message || "Could not delete the auction.");
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    if (!deleting) onClose();
  }

  return (
    <div
      className="delete-auction__overlay"
      onMouseDown={handleClose}
    >
      <section
        className="delete-auction"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-auction-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="delete-auction__close-button"
          type="button"
          onClick={handleClose}
          disabled={deleting}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id="delete-auction-title">Delete auction?</h2>
        <p>
          Are you sure you want to delete “{auction.title}”? This action cannot
          be undone.
        </p>

        {error && <p className="delete-auction__error" role="alert">{error}</p>}

        <div className="delete-auction__actions">
          <button type="button" onClick={handleClose} disabled={deleting}>
            Cancel
          </button>
          <button
            className="delete-auction__confirm-button"
            type="button"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete auction"}
          </button>
        </div>
      </section>
    </div>
  );
}