import "./Nav.css";
import Search from "../../images/search-icon.svg";
import { useContext } from "react";
import CurrentUserContext from "../../contexts/CurrentUserContext";

export default function Nav({
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
  onCreateAuctionClick,
}) {
  const { user } = useContext(CurrentUserContext);

  return (
    <>
      <nav className="nav">
        <h1 className="nav__title">Auto Bids</h1>
        <form className="nav__search-form">
          <input
            className="nav__search-input"
            type="text"
            placeholder="Search..."
          ></input>
          <button className="nav__search-button" type="submit">
            <img className="nav__search-icon" src={Search} />
          </button>
        </form>
        <div className="nav__acc-buttons">
          {user ? (
            <>
              <span className="nav__user-email">{user.email}</span>
              <button
                className="nav__logout-button"
                type="button"
                onClick={onLogoutClick}
              >
                Log Out
              </button>
              <button type="button" onClick={onCreateAuctionClick}>
                Sell a car
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
