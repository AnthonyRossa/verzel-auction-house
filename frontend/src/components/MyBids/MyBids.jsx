import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import "./MyBids.css";
import ConfirmActionModal from "../ConfirmActionModal/ConfirmActionModal";
import useTitleSearch from "../../hooks/useTitleSearch";
import SearchResults from "../SearchResults/SearchResults";

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
  const [auctionToWithdraw, setAuctionToWithdraw] = useState(null);
  const { searchTerm, clearSearch } = useTitleSearch();

  const filteredAuctions = auctions.filter((auction) =>
    auction.title.toLowerCase().includes(searchTerm),
  );

  useEffect(() => {
    if (!user || !token) return undefined;

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
      <h3 className="my-bids__title">My Bids</h3>
      <SearchResults searchTerm={searchTerm} onClear={clearSearch} />
      {error && (
        <p className="my-bids__error" role="alert">
          {error}
        </p>
      )}

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
                <h2 className="my-bids__vehicle-title">{auction.title}</h2>
                <p className="my-bids__metadata">
                  {auction.model_year} ·{" "}
                  {Number(auction.mileage).toLocaleString()} miles
                </p>
                <p className="my-bids__price">
                  Your highest bid: {formatPrice(auction.my_highest_bid)}
                </p>
                <p className="my-bids__price">
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
                {Number(auction.my_highest_bid) >=
                  Number(auction.current_bid ?? auction.starting_price) &&
                  new Date(auction.ends_at) > new Date() && (
                    <button
                      className="my-bids__withdraw-button"
                      type="button"
                      onClick={() => setAuctionToWithdraw(auction)}
                    >
                      Withdraw leading bid
                    </button>
                  )}
                <Link
                  className="my-bids__view-link"
                  to={`/auctions/${auction.id}`}
                >
                  View auction
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      {auctionToWithdraw && (
        <ConfirmActionModal
          title="Withdraw leading bid?"
          message={`Withdraw your leading bid on "${auctionToWithdraw.title}"? Your reserved balance will be released.`}
          confirmText="Withdraw bid"
          onClose={() => setAuctionToWithdraw(null)}
          onConfirm={async () => {
            await api.withdrawBid(auctionToWithdraw.id, token);
            setAuctions(await api.getMyBids(token));
          }}
        />
      )}
    </main>
  );
}
