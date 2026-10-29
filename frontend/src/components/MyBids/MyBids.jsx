import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadBids() {
      try {
        setAuctions(
          await api.getMyBids(token, { signal: controller.signal }),
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load your bids.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (user && token) loadBids();
    else setLoading(false);

    return () => controller.abort();
  }, [user, token]);

  if (!user) return <main className="my-bids">Please log in to view your bids.</main>;
  if (loading) return <main className="my-bids">Loading your bids...</main>;

  return (
    <main className="my-bids">
      <h1>My Bids</h1>
      {error && <p role="alert">{error}</p>}

      {!error && auctions.length === 0 ? (
        <p>You haven’t bid on any auctions yet.</p>
      ) : (
        <ul className="my-bids__list">
          {auctions.map((auction) => (
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
                <p>Current bid: {formatPrice(auction.current_bid ?? auction.starting_price)}</p>
                <Link to={`/auctions/${auction.id}`}>View auction</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}