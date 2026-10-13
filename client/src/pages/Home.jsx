import Hero from "../components/Hero.jsx";
import Marquee from "../components/Marquee.jsx";
import MenuSection from "../components/MenuSection.jsx";
import Story from "../components/Story.jsx";
import Visit from "../components/Visit.jsx";
import Footer from "../components/Footer.jsx";

export default function Home({ ready }) {
  return (
    <main>
      <Hero ready={ready} />
      <Marquee />
      <MenuSection />
      <Story />
      <Visit />
      <Footer />
    </main>
  );
}
