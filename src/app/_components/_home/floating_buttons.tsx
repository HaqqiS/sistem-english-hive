"use client";

import { useState, useEffect } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";

export default function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <a
        href="https://wa.me/+62895803512835"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-6 bottom-6 z-40"
        aria-label="Chat on WhatsApp"
      >
        <div className="flex h-14 w-14 animate-pulse cursor-pointer items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:animate-none hover:bg-green-600">
          <MessageCircle className="h-6 w-6" />
        </div>
      </a>

      {/* Scroll to Top Button */}

      {isClient &&
        showScrollTop && ( // 3. Tambahkan kondisi isClient
          <button
            onClick={scrollToTop}
            className="fixed right-6 bottom-24 z-40"
            aria-label="Scroll to top"
          >
            <div className="text-accent flex h-14 w-14 items-center justify-center rounded-full border border-gray-300 bg-white shadow-lg transition-all hover:bg-gray-50">
              <ArrowUp className="h-6 w-6" />
            </div>
          </button>
        )}
    </>
  );
}
