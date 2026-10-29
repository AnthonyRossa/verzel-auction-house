import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadAuctions() {
      try {
        const allAuctions = await api.getAuctions({
          signal: controller.signal,
        });

        setAuctions(
          allAuctions.filter(
            (auction) => String(auction.seller_id) === String(user?.id),
          ),
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Could not load your auctions.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (user) loadAuctions();
    else setLoading(false);

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
      <h1 className="my-auctions__title">My Auctions</h1>

      {error && <p role="alert">{error}</p>}

      {auctions.length === 0 ? (
        <p>You haven’t created any auctions yet.</p>
      ) : (
        <ul className="my-auctions__list">
          {auctions.map((auction) => (
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
