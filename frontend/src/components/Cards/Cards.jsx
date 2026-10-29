import { useEffect, useState } from "react";
import "./Cards.css";
import api from "../../utils/api";
import { Link } from "react-router-dom";
import useTitleSearch from "../../hooks/useTitleSearch";
import SearchResults from "../SearchResults/SearchResults";

export default function Cards() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
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
      <SearchResults searchTerm={searchTerm} onClear={clearSearch} />
      {error && (
        <p className="cards__error" role="alert">
          {error}
        </p>
      )}
      {filteredAuctions.length === 0 ? (
        <p className="cards__empty">
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
              {auction.image_url && (
                <img
                  className="cards__image"
                  src={auction.image_url}
                  alt={`${auction.title} car`}
                  loading="lazy"
                />
              )}
              <h3 className="cards__title">{auction.title}</h3>
              <p className="cards__metadata">
                {auction.model_year} ·{" "}
                {Number(auction.mileage).toLocaleString()} miles
              </p>
              <p className="cards__description">{auction.description}</p>
              <p className="cards__current-bid">
                Current bid:{" "}
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(
                  Number(auction.current_bid ?? auction.starting_price),
                )}
              </p>
              <p className="cards__ends">
                Ends: {new Date(auction.ends_at).toLocaleString()}
              </p>
            </Link>
          </article>
        ))
      )}
    </main>
  );
}
