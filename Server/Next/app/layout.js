import "./global.css";
import "./media.css";
import Link from "next/link";

const logo = "/images/logo.png";

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <title>IT-College</title>
      </head>

      <body>

        <header>
          <img src={logo} alt="logo" />

          <nav>
            <a href="#prof">Профориентирование</a>
            <a href="#about">О нас</a>
            <Link href="/test" className="headerBtn">
              Начать сейчас!
            </Link>
          </nav>
        </header>

        {children}

      </body>
    </html>
  );
}