import { useState } from "react";
import "./App.css";
import Nav from "../Nav/Nav";
import Cards from "../Cards/Cards";
import Footer from "../Footer/Footer";
import Login from "../Login/Login";

export default function App() {
  const [session, setSession] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <Nav user={session?.user} onLoginClick={() => setIsLoginOpen(true)} />

      {isLoginOpen && (
        <Login onLogin={setSession} onClose={() => setIsLoginOpen(false)} />
      )}
      <Cards />
      <Footer />
    </>
  );
}
