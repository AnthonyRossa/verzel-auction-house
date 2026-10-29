import { useContext, useEffect, useState } from "react";
import api from "../../utils/api";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import "./Wallet.css";

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export default function Wallet() {
  const { user, token } = useContext(CurrentUserContext);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!user || !token) return undefined;

    const controller = new AbortController();

    async function loadBalance() {
      try {
        setBalance(await api.getWallet(token, { signal: controller.signal }));
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadBalance();
    return () => controller.abort();
  }, [user, token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setAdding(true);

    const form = event.currentTarget;
    const amount = new FormData(form).get("amount");

    try {
      setBalance(await api.topUpWallet(amount, token));
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (!user) {
    return <main className="wallet">Please log in to manage your balance.</main>;
  }
  if (loading) return <main className="wallet">Loading balance...</main>;

  return (
    <main className="wallet">
      <h1 className="wallet__title">Balance</h1>
      {error && (
        <p className="wallet__error" role="alert">
          {error}
        </p>
      )}

      {balance && (
        <dl className="wallet__summary">
          <dt className="wallet__term">Total balance</dt>
          <dd className="wallet__value">{formatMoney(balance.total_balance)}</dd>
          <dt className="wallet__term">Committed to leading bids</dt>
          <dd className="wallet__value">
            {formatMoney(balance.committed_balance)}
          </dd>
          <dt className="wallet__term wallet__term--available">
            Available balance
          </dt>
          <dd className="wallet__value wallet__value--available">
            {formatMoney(balance.available_balance)}
          </dd>
        </dl>
      )}

      <form className="wallet__form" onSubmit={handleSubmit}>
        <label className="wallet__label">
          Add demo balance
          <input
            className="wallet__input"
            name="amount"
            type="number"
            min="0.01"
            max="1000000"
            step="0.01"
            required
          />
        </label>
        <button className="wallet__submit" type="submit" disabled={adding}>
          {adding ? "Adding..." : "Add balance"}
        </button>
      </form>
    </main>
  );
}
