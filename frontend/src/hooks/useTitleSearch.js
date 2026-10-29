import { useLocation, useNavigate } from "react-router-dom";

export default function useTitleSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchTerm =
    new URLSearchParams(location.search).get("search")?.trim().toLowerCase() ??
    "";

  function clearSearch() {
    navigate({ pathname: location.pathname, search: "" });
  }

  return { searchTerm, clearSearch };
}
