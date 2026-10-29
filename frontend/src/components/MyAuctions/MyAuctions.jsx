import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import "./MyAuctions.css";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import DeleteAuction from "../DeleteAuction/DeleteAuction";

export default function MyAuctions({ onEdit, onDeleted }) {
  const { user } = useContext(CurrentUserContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auctionToDelete, setAuctionToDelete] = useState(null);
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
        const allAuctions = await api.getAuctions({
          signal: controller.signal,
        });

        setAuctions(
          allAuctions.filter(
            (auction) => String(auction.seller_id) === String(user?.id),
          ),
        );
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load your auctions.");
        }
      } finally {
        requestInProgress = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (user) {
      refreshAuctions();
      const intervalId = window.setInterval(refreshAuctions, 5000);

      return () => {
        window.clearInterval(intervalId);
        controller.abort();
      };
    }

    setLoading(false);
    return () => controller.abort();
  }, [user]);

  if (!user)
    return (
      <main>
        <p>Please log in to manage your auctions.</p>
      </main>
    );
  if (loading)
    return (
      <main>
        <p>Loading your auctions...</p>
      </main>
    );

  return (
    <main className="my-auctions">
      <h3 className="my-auctions__title">My Auctions</h3>
      {searchTerm && (
        <section className="search-results">
          <p>Search results for “{searchTerm}”</p>
          <button type="button" onClick={clearSearch}>
            Back to all results
          </button>
        </section>
      )}

      {error && <p role="alert">{error}</p>}

      {filteredAuctions.length === 0 ? (
        <p>
          {searchTerm
            ? `No created auctions match "${searchTerm}".`
            : "You haven't created any auctions yet."}
        </p>
      ) : (
        <ul className="my-auctions__list">
          {filteredAuctions.map((auction) => (
            <li className="my-auctions__item" key={auction.id}>
              {auction.image_url && (
                <img
                  className="my-auctions__image"
                  src={auction.image_url}
                  alt={`${auction.title} car`}
                />
              )}

              <div className="my-auctions__info">
                <h2>{auction.title}</h2>
                <p>
                  {auction.model_year} ·{" "}
                  {Number(auction.mileage).toLocaleString()} miles
                </p>
                <p>
                  Starting price:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(Number(auction.starting_price))}
                </p>
                <p className="my-auctions__current-bid">
                  Current bid:{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(
                    Number(auction.current_bid ?? auction.starting_price),
                  )}
                </p>
                <Link to={`/auctions/${auction.id}`}>View auction</Link>
              </div>

              <div className="my-auctions__actions">
                <button type="button" onClick={() => onEdit(auction)}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuctionToDelete(auction);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {auctionToDelete && (
        <DeleteAuction
          auction={auctionToDelete}
          onClose={() => setAuctionToDelete(null)}
          onDeleted={onDeleted}
        />
      )}
    </main>
  );
}
