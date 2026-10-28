import { useState } from "react";
import api from "../../utils/api";
import "./CreateAuction.css";

function toLocalDateTime(value) {
  if (!value) return "";

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function CreateAuction({
  token,
  auction = null,
  onClose,
  onCreated,
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(auction);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const auctionData = {
      title: form.get("title").trim(),
      description: form.get("description") || null,
      image_url: form.get("image_url").trim(),
      mileage: Number(form.get("mileage")),
      model_year: Number(form.get("model_year")),
      starting_price: Number(form.get("starting_price")),
      ends_at: new Date(form.get("ends_at")).toISOString(),
    };

    try {
      if (isEditing) {
        await api.updateAuction(auction.id, auctionData, token);
      } else {
        await api.createAuction(auctionData, token);
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-auction__overlay" onMouseDown={onClose}>
      <section
        className="create-auction"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-auction-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="create-auction__close-button"
          type="button"
          onClick={onClose}
        >
          Close
        </button>

        <h2 id="create-auction-title">
          {isEditing ? "Edit car auction" : "Create car auction"}
        </h2>

        <form className="create-auction__form" onSubmit={handleSubmit}>
          <label className="create-auction__label">
            Vehicle title
            <input
              className="create-auction__input"
              name="title"
              defaultValue={auction?.title ?? ""}
              required
            />
          </label>

          <label className="create-auction__label">
            Model year
            <input
              className="create-auction__input"
              name="model_year"
              type="number"
              min="1886"
              max="2100"
              defaultValue={auction?.model_year ?? ""}
              required
            />
          </label>

          <label className="create-auction__label">
            Mileage
            <input
              className="create-auction__input"
              name="mileage"
              type="number"
              min="0"
              defaultValue={auction?.mileage ?? ""}
              required
            />
          </label>

          <label className="create-auction__label">
            Image URL
            <input
              className="create-auction__input"
              name="image_url"
              type="url"
              defaultValue={auction?.image_url ?? ""}
              required
            />
          </label>

          <label className="create-auction__label">
            Starting price
            <input
              className="create-auction__input"
              name="starting_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={auction?.starting_price ?? ""}
              required
            />
          </label>

          <label className="create-auction__label">
            Auction ends
            <input
              className="create-auction__input"
              name="ends_at"
              type="datetime-local"
              defaultValue={toLocalDateTime(auction?.ends_at)}
              required
            />
          </label>

          <label className="create-auction__label">
            Description
            <textarea
              className="create-auction__input"
              name="description"
              defaultValue={auction?.description ?? ""}
            />
          </label>

          {error && <p role="alert">{error}</p>}

          <button
            className="create-auction__submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save changes"
                : "Create auction"}
          </button>
        </form>
      </section>
    </div>
  );
}