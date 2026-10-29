import "./Nav.css";
import Search from "../../images/search-icon.svg";
import { useContext, useEffect, useState } from "react";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../../utils/api";

export default function Nav({
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
  onCreateAuctionClick,
}) {
  const { user, token } = useContext(CurrentUserContext);
  const [balance, setBalance] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const availableBalance =
    balance?.token === token ? balance.available : null;

  useEffect(() => {
    if (!user || !token) return undefined;

    const controller = new AbortController();
    let requestInProgress = false;

    async function loadBalance() {
      if (requestInProgress) return;
      requestInProgress = true;

      try {
        const wallet = await api.getWallet(token, {
          signal: controller.signal,
        });
        setBalance({
          token,
          available: Number(wallet.available_balance),
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not load balance", error);
        }
      } finally {
        requestInProgress = false;
      }
    }

    loadBalance();
    const intervalId = window.setInterval(loadBalance, 5000);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [user, token]);

  function handleSearchSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const title = String(new FormData(form).get("search") ?? "").trim();

    form.elements.search.value = "";

    const pathname = location.pathname.startsWith("/auctions/")
      ? "/"
      : location.pathname;

    navigate({
      pathname,
      search: title ? `?search=${encodeURIComponent(title)}` : "",
    });
  }

  return (
    <>
      <nav className="nav">
        <h1 className="nav__title">
          <Link className="nav__title-link" to="/">Auto Bids</Link>
        </h1>
        {location.pathname !== "/" && (
          <button
            className="nav__home-button"
            type="button"
            onClick={() => navigate("/")}
          >
            Return to Home Page
          </button>
        )}
        <form className="nav__search-form" onSubmit={handleSearchSubmit}>
          <input
            className="nav__search-input"
            name="search"
            type="search"
            placeholder="Search by title..."
          />
          <button className="nav__search-button" type="submit">
            <img className="nav__search-icon" src={Search} alt="Search" />
          </button>
        </form>

        {user && (
          <div className="nav__user-actions">
            <button
              className="nav__action-button"
              type="button"
              onClick={() =>
                navigate({ pathname: "/my-auctions", search: location.search })
              }
            >
              My Auctions
            </button>

            <button
              className="nav__action-button"
              type="button"
              onClick={() =>
                navigate({ pathname: "/my-bids", search: location.search })
              }
            >
              My Bids
            </button>
            <button
              className="nav__action-button"
              type="button"
              onClick={onCreateAuctionClick}
            >
              Sell a car
            </button>
          </div>
        )}

        <div className="nav__acc-buttons">
          {user ? (
            <>
              <span className="nav__user-email">{user.email}</span>
              <button
                className="nav__balance-button"
                type="button"
                onClick={() => navigate("/balance")}
              >
                Balance:{" "}
                {availableBalance === null
                  ? "..."
                  : new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(availableBalance)}
              </button>
              <button
                className="nav__logout-button"
                type="button"
                onClick={onLogoutClick}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                className="nav__create-button"
                type="button"
                onClick={onRegisterClick}
              >
                Create Account
              </button>
              <button
                className="nav__login-button"
                type="button"
                onClick={onLoginClick}
              >
                Log In
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
