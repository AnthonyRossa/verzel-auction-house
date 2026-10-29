import { useState } from "react";
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

export default function App() {
  const [session, setSession] = useState(null);
  const [openModal, setOpenModal] = useState(null);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [auctionsVersion, setAuctionsVersion] = useState(0);

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
        </Routes>
        <Footer />
      </CurrentUserContext.Provider>
    </>
  );
}
