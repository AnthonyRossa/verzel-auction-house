import { useEffect, useState } from "react";
import "./Cards.css";
import api from "../../utils/api";
import { useContext } from "react";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Cards({ onEdit, onDeleted }) {
  const { user, token } = useContext(CurrentUserContext);
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  function clearSearch() {
    navigate({ pathname: location.pathname, search: "" });
  }
  const searchTerm =
    new URLSearchParams(location.search).get("search")?.trim().toLowerCase() ??
    "";

  const filteredAuctions = auctions.filter((auction) =>
    auction.title.toLowerCase().includes(searchTerm),
  );

  useEffect(() => {
    const controller = new AbortController();
    let requestInProgress = false;

    async function refreshAuctions() {
      if (requestInProgress) return;
      requestInProgress = true;

      try {
        const data = await api.getAuctions({ signal: controller.signal });
        setAuctions(data);
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Could not load auctions. Please try again.");
        }
      } finally {
        requestInProgress = false;
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    refreshAuctions();
    const intervalId = window.setInterval(refreshAuctions, 5000);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, []);

  if (isLoading) return <main className="cards">Loading auctions...</main>;
  if (error && auctions.length === 0) {
    return (
      <main className="cards" role="alert">
        {error}
      </main>
    );
  }

  return (
    <main className="cards">
      {searchTerm && (
        <section className="search-results">
          <p>Search results for “{searchTerm}”</p>
          <button type="button" onClick={clearSearch}>
            Back to all results
          </button>
        </section>
      )}
      {filteredAuctions.length === 0 ? (
        <p>
          {searchTerm
            ? `No auctions match "${searchTerm}".`
            : "No auctions are available yet."}
        </p>
      ) : (
        filteredAuctions.map((auction) => (
          <article className="cards__card" key={auction.id}>
            <Link
              className="cards__details-link"
              to={`/auctions/${auction.id}`}
            >
              {error && (
                <p className="cards__error" role="alert">
                  {error}
                </p>
              )}
              {auction.image_url && (
                <img
                  className="cards__image"
                  src={auction.image_url}
                  alt={`${auction.title} car`}
                  loading="lazy"
                />
              )}
              <h3 className="cards__title">{auction.title}</h3>
              <p>
                {auction.model_year} ·{" "}
                {Number(auction.mileage).toLocaleString()} miles
              </p>
              <p>{auction.description}</p>
              <p className="cards__current-bid">
                Current bid:{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(
                  Number(auction.current_bid ?? auction.starting_price),
                )}
              </p>
              <p>Ends: {new Date(auction.ends_at).toLocaleString()}</p>
            </Link>
          </article>
        ))
      )}
    </main>
  );
}
