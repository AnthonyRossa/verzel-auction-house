import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./AuctionDetails.css";
import api from "../../utils/api";
import CurrentUserContext from "../../contexts/CurrentUserContext";

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value));
}

export default function AuctionDetails({ onLoginClick }) {
  const { id } = useParams();
  const { user, token } = useContext(CurrentUserContext);
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bidError, setBidError] = useState("");
  const [placingBid, setPlacingBid] = useState(false);
  const [myAuctionBid, setMyAuctionBid] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isLoadingRequest = false;

    async function refreshAuction() {
      if (isLoadingRequest) return;
      isLoadingRequest = true;

      try {
        const [auctionData, bidData, myBids] = await Promise.all([
          api.getAuction(id, { signal: controller.signal }),
          api.getBids(id, { signal: controller.signal }),
          token ? api.getMyBids(token, { signal: controller.signal }) : [],
        ]);

        setAuction(auctionData);
        setBids(bidData);
        setMyAuctionBid(
          myBids.find((bidAuction) => String(bidAuction.id) === String(id)) ??
            null,
        );
        setError("");
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        isLoadingRequest = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    refreshAuction();
    const intervalId = window.setInterval(refreshAuction, 5000);

    return () => {
      window.clearInterval(intervalId);
      controller.abort();
    };
  }, [id, token]);

  const highestBid = bids.length
    ? Number(bids[0].amount)
    : Number(auction?.starting_price);

  async function handleBidSubmit(event) {
    event.preventDefault();
    setBidError("");
    setPlacingBid(true);

    const form = event.currentTarget;
    const amount = new FormData(form).get("amount");

    try {
      await api.placeBid(id, amount, token);
      const [updatedBids, myBids] = await Promise.all([
        api.getBids(id),
        api.getMyBids(token),
      ]);

      setBids(updatedBids);
      setMyAuctionBid(
        myBids.find((bidAuction) => String(bidAuction.id) === String(id)) ??
          null,
      );
      form.reset();
    } catch (err) {
      setBidError(err.message);
    } finally {
      setPlacingBid(false);
    }
  }

  if (loading) return <main>Loading auction...</main>;
  if (error && !auction) return <main role="alert">{error}</main>;
  if (!auction) return <main>Auction not found.</main>;

  const isOwner = user && String(user.id) === String(auction.seller_id);

  return (
    <main className="auction-details">
      {error && <p role="alert">Could not refresh auction: {error}</p>}
      {auction.image_url && (
        <img
          className="auction-details__image"
          src={auction.image_url}
          alt={`${auction.title} car`}
        />
      )}

      <h1 className="auction-details__title">{auction.title}</h1>
      <p className="auction-details__text">
        {auction.model_year} · {Number(auction.mileage).toLocaleString()} miles
      </p>
      <p className="auction-details__text">{auction.description}</p>
      <p className="auction-details__text">
        Starting price: {formatPrice(auction.starting_price)}
      </p>
      <p className="auction-details__text">
        Current bid: {formatPrice(highestBid)}
      </p>
      {myAuctionBid && (
        <p
          className={`bid-status ${
            Number(myAuctionBid.my_highest_bid) >= highestBid
              ? "bid-status--winning"
              : "bid-status--losing"
          }`}
        >
          {Number(myAuctionBid.my_highest_bid) >= highestBid
            ? "You’re winning"
            : "You’ve been outbid"}
        </p>
      )}
      <p className="auction-details__text">
        Ends: {new Date(auction.ends_at).toLocaleString()}
      </p>

      {isOwner ? (
        <p className="auction-details__warning">
          You cannot bid on your own auction.
        </p>
      ) : user ? (
        <form className="auction-details__form" onSubmit={handleBidSubmit}>
          <label className="auction-details__label">
            Your bid
            <input
              className="auction-details__input"
              name="amount"
              type="number"
              min={(highestBid + 0.01).toFixed(2)}
              step="0.01"
              required
            />
          </label>
          <button
            className="auction-details__button"
            type="submit"
            disabled={placingBid}
          >
            {placingBid ? "Placing bid..." : "Place bid"}
          </button>
          {bidError && <p role="alert">{bidError}</p>}
        </form>
      ) : (
        <button
          className="auction-details__text"
          type="button"
          onClick={onLoginClick}
        >
          Log in to place a bid
        </button>
      )}
      <section className="auction-details__history">
        <h2>Bid history</h2>

        {bids.length === 0 ? (
          <p className="auction-details__text">No bids yet.</p>
        ) : (
          <ol className="auction-details__bid-list">
            {bids.map((bid) => (
              <li className="auction-details__bid" key={bid.id}>
                <span>{bid.bidder_name}</span>
                <strong>{formatPrice(bid.amount)}</strong>
                <time dateTime={bid.created_at}>
                  {new Date(bid.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
