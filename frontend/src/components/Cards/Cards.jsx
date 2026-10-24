import "./Cards.css";
import CarImage from "../../images/corolla.png"

export default function Cards() {
  return (
    <>
      <section className="cards">
        <div className="cards__card">
          <img className="cards__img" src={CarImage}/>
          <h3 className="cards__title">Car Name</h3>
          <p className="cards__price">$10000</p>
        </div>
      </section>
    </>
  );
}
