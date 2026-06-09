import { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About SoundWave | Crafted For Those Who Hear More",
  description: "Learn about the SoundWave philosophy, our premium audio equipment engineering process, and our commitment to handcrafting the ultimate sound experience.",
  openGraph: {
    title: "About SoundWave | Crafted For Those Who Hear More",
    description: "Learn about the SoundWave philosophy, our premium audio equipment engineering process, and our commitment to handcrafting the ultimate sound experience.",
    url: "https://soundwave.com/about",
    siteName: "SoundWave",
    locale: "en_US",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
