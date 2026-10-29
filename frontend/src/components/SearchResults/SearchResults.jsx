import "./SearchResults.css";

export default function SearchResults({ searchTerm, onClear }) {
  if (!searchTerm) return null;

  return (
    <section className="search-results" aria-label="Search results">
      <p className="search-results__query">
        Search results for “{searchTerm}”
      </p>
      <button
        className="search-results__clear-button"
        type="button"
        onClick={onClear}
      >
        Back to all results
      </button>
    </section>
  );
}
