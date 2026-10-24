import "./Nav.css";
import Search from "../../images/search-icon.svg";

export default function Nav() {
  return (
    <>
      <section className="nav">
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
        <button className="nav__create-button">Create Account</button>
        <button className="nav__login-button">Log In</button>
        </div>
      </section>
    </>
  );
}
