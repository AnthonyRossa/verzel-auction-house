import { useState } from "react";
import "./Login.css";
import api from "../../utils/api";

export default function Login({ onLogin, onClose }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const data = await api.login(
        formData.get("email"),
        formData.get("password"),
      );

      onLogin(data);
      onClose();
      form.reset();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <>
      <div className="login" onMouseDown={onClose}>
        <div
          className="login__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button className="login__close-button" type="button" onClick={onClose}>
            Close
          </button>
          <h3 className="login__title" id="login-title">Login</h3>
          <form className="login__form" onSubmit={handleSubmit}>
            <label className="login__input-title" htmlFor="email">
              E-mail
            </label>
            <input
              className="login__input"
              id="email"
              name="email"
              type="email"
              placeholder="E-mail"
              required
            />
            <label className="login__input-title" htmlFor="password">
              Password
            </label>
            <input
              className="login__input"
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              required
            />
            <button
              className="Login__button"
              type="submit"
              disabled={isLoading}
              
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>
            {error && <p role="alert">{error}</p>}
          </form>
        </div>
      </div>
    </>
  );
}
