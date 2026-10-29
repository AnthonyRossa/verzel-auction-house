const BASE_URL = import.meta.env.API_URL || "/api";

class Api {
  constructor(baseUrl) {
    this._baseUrl = baseUrl;
  }

  async _makeRequest(endpoint, { method = "GET", body, token, signal } = {}) {
    const headers = {};

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this._baseUrl}${endpoint}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
  }

  login(email, password) {
    return this._makeRequest("/users/login", {
      method: "POST",
      body: { email, password },
    });
  }

  register({ name, email, password }) {
    return this._makeRequest("/users/register", {
      method: "POST",
      body: { name, email, password },
    });
  }

  getAuctions({ signal } = {}) {
    return this._makeRequest("/auctions", { signal });
  }

  getAuction(id, { signal } = {}) {
    return this._makeRequest(`/auctions/${id}`, { signal });
  }

  createAuction(auctionData, token) {
    return this._makeRequest("/auctions", {
      method: "POST",
      body: auctionData,
      token,
    });
  }

  placeBid(auctionId, amount, token) {
    return this._makeRequest(`/auctions/${auctionId}/bids`, {
      method: "POST",
      body: { amount },
      token,
    });
  }

  getBids(auctionId, { signal } = {}) {
    return this._makeRequest(`/auctions/${auctionId}/bids`, { signal });
  }

  updateAuction(id, auctionData, token) {
    return this._makeRequest(`/auctions/${id}`, {
      method: "PUT",
      body: auctionData,
      token,
    });
  }

  deleteAuction(id, token) {
    return this._makeRequest(`/auctions/${id}`, {
      method: "DELETE",
      token,
    });
  }

  getMyBids(token, { signal } = {}) {
    return this._makeRequest("/bids/mine", { token, signal });
  }
}

const api = new Api(BASE_URL);

export default api;
