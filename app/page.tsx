import About from "@/components/sections/About";
import CommitLog from "@/components/sections/CommitLog";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import Hero from "@/components/sections/Hero";
import Nav from "@/components/sections/Nav";
import OffTheClock from "@/components/sections/OffTheClock";
import Projects from "@/components/sections/Projects";
import Statement from "@/components/sections/Statement";
import Toolkit from "@/components/sections/Toolkit";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Statement />
        <Projects />
        <Toolkit />
        <CommitLog />
        <About />
        <OffTheClock />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
