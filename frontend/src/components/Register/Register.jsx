import { useState } from "react";
import "./Register.css";
import api from "../../utils/api";

export default function Register({ onClose, onSuccess }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await api.register({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      });

      form.reset();
      onSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="register" onMouseDown={onClose}>
      <section
        className="register__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="register__close-button"
          type="button"
          onClick={onClose}
          aria-label="Close registration"
        >
          Close
        </button>

        <h2 className="register__title" id="register-title">
          Create Account
        </h2>

        <form className="register__form" onSubmit={handleSubmit}>
          <label className="register__input-title" htmlFor="register-name">
            Name
          </label>
          <input
            className="register__input"
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={100}
            required
          />

          <label className="register__input-title" htmlFor="register-email">
            E-mail
          </label>
          <input
            className="register__input"
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={255}
            required
          />

          <label className="register__input-title" htmlFor="register-password">
            Password
          </label>
          <input
            className="register__input"
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required
          />

          <button
            className="register__button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>

          {error && (
            <p className="register__error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}