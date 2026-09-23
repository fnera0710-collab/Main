"use client";

import { useState } from "react";
import Link from "next/link";

const collage1 = "/images/collage1.png";
const collage2 = "/images/collage2.png";
const prof = "/images/prof.png";

export default function Home() {

  const branches = [
    {
      image: collage1,
      title: "Корпус A",
      text: "Современный колледж с IT направлениями, лабораториями и практическим обучением.",
      address: "г. Семей, ул. Затаевича 4"
    },
    {
      image: collage2,
      title: "Корпус B",
      text: "Учебный корпус с дополнительными программами подготовки специалистов.",
      address: "г. Семей, ул. Челюскинцева, 46а"
    }
  ];

  const [current, setCurrent] = useState(0);

  function nextSlide() {
    setCurrent((current + 1) % branches.length);
  }

  function prevSlide() {
    setCurrent(current === 0 ? branches.length - 1 : current - 1);
  }

  return (
    <main>

      <section className="hero" id="prof">

        <div className="heroText">
          <h1>Профориентирование</h1>

          <p>
            Пройди современное тестирование и узнай,
            какие направления подходят именно тебе.
          </p>

          <Link href="/test">
            <button>Начать</button>
          </Link>
          
        </div>

        <img
          src={prof}
          alt="prof"
          className="heroImage"
        />

      </section>

      <section className="advantages">

        <div className="card">
          <h3>Узнай кто ты</h3>
          <p>Получите подробный анализ.</p>
        </div>

        <div className="card">
          <h3>Твой тип</h3>
          <p>Определи свои сильные стороны.</p>
        </div>

        <div className="card">
          <h3>Твоя личность</h3>
          <p>Узнай особенности характера.</p>
        </div>

        <div className="card">
          <h3>Твой склад ума</h3>
          <p>Определи подходящие профессии.</p>
        </div>

      </section>

      <section className="about" id="about">

        <h2>О нас</h2>

        <div className="collegeBlock">

          <img
            src={branches[current].image}
            alt="college"
            className="collegeImage"
          />

          <div className="collegeInfo">

            <h3>{branches[current].title}</h3>

            <p>{branches[current].text}</p>

            <h4>О колледже</h4>

            <p>
              Мы готовим специалистов по современным
              направлениям и помогаем студентам
              получить востребованные навыки.
            </p>

            <h4>Адрес</h4>

            <p>{branches[current].address}</p>

            <div className="sliderButtons">
              <button onClick={prevSlide}>←</button>
              <button onClick={nextSlide}>→</button>
            </div>

          </div>

        </div>

      </section>

      <footer>

        <h2>Обращайтесь к нам если есть вопросы!</h2>

        <div className="contactBlock">
          <p>+7 (777) 123-45-67</p>
          <p>college@mail.kz</p>
        </div>

        <p><Link className="Hehe" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1">FREE Robux</Link></p>

      </footer>

    </main>
  );
}