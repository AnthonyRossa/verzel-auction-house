import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import "./MyBids.css";

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export default function MyBids() {
  const { user, token } = useContext(CurrentUserContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
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
    if (!user || !token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isLoadingRequest = false;

    async function refreshBids() {
      if (isLoadingRequest) return;
      isLoadingRequest = true;

      try {
        setAuctions(await api.getMyBids(token, { signal: controller.signal }));
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load your bids.");
        }
      } finally {
        isLoadingRequest = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    refreshBids();
    const intervalId = window.setInterval(refreshBids, 5000);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [user, token]);

  if (!user)
    return <main className="my-bids">Please log in to view your bids.</main>;
  if (loading) return <main className="my-bids">Loading your bids...</main>;

  return (
    <main className="my-bids">
      <h3>My Bids</h3>
      {searchTerm && (
        <section className="search-results">
          <p>Search results for “{searchTerm}”</p>
          <button type="button" onClick={clearSearch}>
            Back to all results
          </button>
        </section>
      )}
      {error && <p role="alert">{error}</p>}

      {!error && filteredAuctions.length === 0 ? (
        <p>
          {searchTerm
            ? `No bidded auctions match "${searchTerm}".`
            : "No haven't bid on any auctions yet."}
        </p>
      ) : (
        <ul className="my-bids__list">
          {filteredAuctions.map((auction) => (
            <li className="my-bids__item" key={auction.id}>
              {auction.image_url && (
                <img
                  className="my-bids__image"
                  src={auction.image_url}
                  alt={`${auction.title} car`}
                />
              )}

              <div className="my-bids__info">
                <h2>{auction.title}</h2>
                <p>
                  {auction.model_year} ·{" "}
                  {Number(auction.mileage).toLocaleString()} miles
                </p>
                <p>Your highest bid: {formatPrice(auction.my_highest_bid)}</p>
                <p>
                  Current bid:{" "}
                  {formatPrice(auction.current_bid ?? auction.starting_price)}
                </p>
                <p
                  className={`bid-status ${
                    Number(auction.my_highest_bid) >=
                    Number(auction.current_bid ?? auction.starting_price)
                      ? "bid-status--winning"
                      : "bid-status--losing"
                  }`}
                >
                  {Number(auction.my_highest_bid) >=
                  Number(auction.current_bid ?? auction.starting_price)
                    ? "You’re winning"
                    : "You’ve been outbid"}
                </p>
                <Link to={`/auctions/${auction.id}`}>View auction</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
