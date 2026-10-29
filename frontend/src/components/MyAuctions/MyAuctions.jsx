import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import "./MyAuctions.css";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import ConfirmActionModal from "../ConfirmActionModal/ConfirmActionModal";
import useTitleSearch from "../../hooks/useTitleSearch";
import SearchResults from "../SearchResults/SearchResults";

export default function MyAuctions({ onEdit, onDeleted }) {
  const { user, token } = useContext(CurrentUserContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auctionToDelete, setAuctionToDelete] = useState(null);
  const { searchTerm, clearSearch } = useTitleSearch();

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

    if (!user) return () => controller.abort();

    refreshAuctions();
    const intervalId = window.setInterval(refreshAuctions, 5000);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
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
      <SearchResults searchTerm={searchTerm} onClear={clearSearch} />

      {error && (
        <p className="my-auctions__error" role="alert">
          {error}
        </p>
      )}

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
                <h2 className="my-auctions__vehicle-title">{auction.title}</h2>
                <p className="my-auctions__metadata">
                  {auction.model_year} ·{" "}
                  {Number(auction.mileage).toLocaleString()} miles
                </p>
                <p className="my-auctions__price">
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
                <Link
                  className="my-auctions__view-link"
                  to={`/auctions/${auction.id}`}
                >
                  View auction
                </Link>
              </div>

              <div className="my-auctions__actions">
                <button
                  className="my-auctions__edit-button"
                  type="button"
                  onClick={() => onEdit(auction)}
                >
                  Edit
                </button>
                <button
                  className="my-auctions__delete-button"
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
        <ConfirmActionModal
          title="Delete auction?"
          message={`Are you sure you want to delete "${auctionToDelete.title}"? This action cannot be undone.`}
          confirmText="Delete auction"
          onClose={() => setAuctionToDelete(null)}
          onConfirm={async () => {
            await api.deleteAuction(auctionToDelete.id, token);
            onDeleted();
          }}
        />
      )}
    </main>
  );
}
