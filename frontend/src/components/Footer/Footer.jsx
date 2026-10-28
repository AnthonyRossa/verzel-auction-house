import "./Footer.css";
import LinkedInLogo from "../../images/linkedin.svg";
import GitHubLogo from "../../images/github.svg";
import EmailLogo from "../../images/email.svg";

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer__dev">Developed by Anthony Rossa</p>
      <div className="footer__links">
        <a
          href="mailto:anthonyr.work@proton.me"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={EmailLogo} alt="Email" className="footer__icon" />
        </a>
        <a
          href="https://www.linkedin.com/in/anthony-rossa-24a362371/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={LinkedInLogo} alt="LinkedIn" className="footer__icon" />
        </a>
        <a
          href="https://github.com/AnthonyRossa"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={GitHubLogo} alt="GitHub" className="footer__icon" />
        </a>
      </div>
    </footer>
  );
}
