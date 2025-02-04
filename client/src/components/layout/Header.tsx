import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Header() {
  const { scrollY } = useScroll();
  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)"]
  );
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      style={{ backgroundColor }}
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm transition-all duration-300 ${
        isScrolled ? "py-4" : "py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/">
          <a className="text-2xl font-bold text-white">SaaS<span className="text-primary">Hub</span></a>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#product">
            <a className="text-gray-300 hover:text-white transition-colors">Product</a>
          </Link>
          <Link href="#resources">
            <a className="text-gray-300 hover:text-white transition-colors">Resources</a>
          </Link>
          <Link href="#pricing">
            <a className="text-gray-300 hover:text-white transition-colors">Pricing</a>
          </Link>
          <Link href="#blog">
            <a className="text-gray-300 hover:text-white transition-colors">Blog</a>
          </Link>
        </nav>

        <Button variant="secondary" className="bg-white text-black hover:bg-gray-100">
          Get Started
        </Button>
      </div>
    </motion.header>
  );
}
