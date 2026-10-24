import { useEffect, useState } from "react";
import "./Cards.css";
import api from "../../utils/api";

export default function Cards() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  const controller = new AbortController();

  async function loadAuctions() {
    try {
      const data = await api.getAuctions({ signal: controller.signal });
      setAuctions(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError("Could not load auctions. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }

  loadAuctions();
  return () => controller.abort();
}, []);

  if (isLoading) return <main className="cards">Loading auctions...</main>;
  if (error) return <main className="cards">{error}</main>;

  return (
    <main className="cards">
      {auctions.length === 0 ? (
        <p>No auctions are available yet.</p>
      ) : (
        auctions.map((auction) => (
          <article className="cards__card" key={auction.id}>
            <h3 className="cards__title">{auction.title}</h3>
            <p>{auction.description}</p>
            <p className="cards__price">
              Starting price:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(auction.starting_price))}
            </p>
            <p>Ends: {new Date(auction.ends_at).toLocaleString()}</p>
          </article>
        ))
      )}
    </main>
  );
}
