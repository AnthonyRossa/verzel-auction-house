import { useState } from "react";
import "./App.css";
import Nav from "../Nav/Nav";
import Cards from "../Cards/Cards";
import Footer from "../Footer/Footer";
import Login from "../Login/Login";
import Register from "../Register/Register";
import CreateAuction from "../CreateAuction/CreateAuction";

export default function App() {
  const [session, setSession] = useState(null);
  const [openModal, setOpenModal] = useState(null);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [auctionsVersion, setAuctionsVersion] = useState(0);

  return (
    <>
      <Nav
        user={session?.user}
        onCreateAuctionClick={() => setShowCreateAuction(true)}
        onLoginClick={() => setOpenModal("login")}
        onRegisterClick={() => setOpenModal("register")}
        onLogoutClick={() => setSession(null)}
      />
      {showCreateAuction && (
        <CreateAuction
          token={session.token}
          onClose={() => setShowCreateAuction(false)}
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
      <Cards key={auctionsVersion} />
      <Footer />
    </>
  );
}
