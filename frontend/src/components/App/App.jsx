import { useState } from "react";
import "./App.css";
import Nav from "../Nav/Nav";
import Cards from "../Cards/Cards";
import Footer from "../Footer/Footer";
import Login from "../Login/Login";
import Register from "../Register/Register";

export default function App() {
  const [session, setSession] = useState(null);
const [openModal, setOpenModal] = useState(null);

  return (
    <>
<Nav
  user={session?.user}
  onLoginClick={() => setOpenModal("login")}
  onRegisterClick={() => setOpenModal("register")}
/>

{openModal === "login" && (
  <Login
    onLogin={setSession}
    onClose={() => setOpenModal(null)}
  />
)}

{openModal === "register" && (
  <Register
    onClose={() => setOpenModal(null)}
    onSuccess={() => setOpenModal("login")}
  />
)}
      <Cards />
      <Footer />
    </>
  );
}
