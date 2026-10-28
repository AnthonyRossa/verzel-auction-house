import { useState } from "react";
import api from "../../utils/api";
import "./CreateAuction.css"

export default function CreateAuction({ token, onClose, onCreated }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      await api.createAuction(
        {
          title: `${form.get("make")} ${form.get("model")}`,
          description: form.get("description") || null,
          image_url: form.get("image_url"),
          mileage: Number(form.get("mileage")),
          model_year: Number(form.get("model_year")),
          starting_price: Number(form.get("starting_price")),
          ends_at: new Date(form.get("ends_at")).toISOString(),
        },
        token,
      );
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
        <h2 id="create-auction-title">Create car auction</h2>

        <form className="create-auction__form" onSubmit={handleSubmit}>
          <label className="create-auction__label">
            Make{" "}
            <input className="create-auction__input" name="make" required />
          </label>
          <label className="create-auction__label">
            Model{" "}
            <input className="create-auction__input" name="model" required />
          </label>
          <label className="create-auction__label">
            Model year{" "}
            <input
              className="create-auction__input"
              name="model_year"
              type="number"
              min="1886"
              required
            />
          </label>
          <label className="create-auction__label">
            Mileage{" "}
            <input
              className="create-auction__input"
              name="mileage"
              type="number"
              min="0"
              required
            />
          </label>
          <label className="create-auction__label">
            Image URL{" "}
            <input
              className="create-auction__input"
              name="image_url"
              type="url"
              required
            />
          </label>
          <label className="create-auction__label">
            Starting price{" "}
            <input
              className="create-auction__input"
              name="starting_price"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </label>
          <label className="create-auction__label">
            Auction ends{" "}
            <input
              className="create-auction__input"
              name="ends_at"
              type="datetime-local"
              required
            />
          </label>
          <label className="create-auction__label">
            Description{" "}
            <textarea className="create-auction__input" name="description" />
          </label>

          {error && <p role="alert">{error}</p>}
          <button
            className="create-auction__submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create auction"}
          </button>
        </form>
      </section>
    </div>
  );
}
