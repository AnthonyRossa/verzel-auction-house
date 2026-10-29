import { useEffect, useState } from "react";
import "./App.css";
import Nav from "../Nav/Nav";
import Cards from "../Cards/Cards";
import Footer from "../Footer/Footer";
import Login from "../Login/Login";
import Register from "../Register/Register";
import CreateAuction from "../CreateAuction/CreateAuction";
import CurrentUserContext from "../../contexts/CurrentUserContext";
import { Navigate, Route, Routes } from "react-router-dom";
import AuctionDetails from "../AuctionDetails/AuctionDetails";
import MyAuctions from "../MyAuctions/MyAuctions";
import MyBids from "../MyBids/MyBids";
import Wallet from "../Wallet/Wallet";

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const savedSession = localStorage.getItem("auction-session");
      return savedSession ? JSON.parse(savedSession) : null;
    } catch (error) {
      console.error("Could not restore saved session", error);
      return null;
    }
  });
  const [openModal, setOpenModal] = useState(null);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [auctionsVersion, setAuctionsVersion] = useState(0);

  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem("auction-session", JSON.stringify(session));
      } else {
        localStorage.removeItem("auction-session");
      }
    } catch (error) {
      console.error("Could not save session", error);
    }
  }, [session]);

  return (
    <>
      <CurrentUserContext.Provider
        value={{
          user: session?.user ?? null,
          token: session?.token ?? null,
        }}
      >
        <Nav
          onCreateAuctionClick={() => setShowCreateAuction(true)}
          onLoginClick={() => setOpenModal("login")}
          onRegisterClick={() => setOpenModal("register")}
          onLogoutClick={() => setSession(null)}
        />

        {(showCreateAuction || editingAuction) && (
          <CreateAuction
            auction={editingAuction}
            onClose={() => {
              setShowCreateAuction(false);
              setEditingAuction(null);
            }}
            onCreated={() => setAuctionsVersion((version) => version + 1)}
          />
        )}

        {openModal === "login" && (
          <Login onLogin={setSession} onClose={() => setOpenModal(null)} />
        )}

        {openModal === "register" && (
          <Register
            onClose={() => setOpenModal(null)}
            onSuccess={() => setOpenModal("login")}
          />
        )}

        <Routes>
          <Route
            path="/"
            element={
              <Cards
                key={auctionsVersion}
                onEdit={setEditingAuction}
                onDeleted={() => setAuctionsVersion((version) => version + 1)}
              />
            }
          />
          <Route
            path="/auctions/:id"
            element={
              <AuctionDetails onLoginClick={() => setOpenModal("login")} />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/my-auctions"
            element={
              <MyAuctions
                key={auctionsVersion}
                onEdit={setEditingAuction}
                onDeleted={() => setAuctionsVersion((version) => version + 1)}
              />
            }
          />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/balance" element={<Wallet />} />{" "}
        </Routes>
        <Footer />
      </CurrentUserContext.Provider>
    </>
  );
}
