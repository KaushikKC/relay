"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

const slides = [
  {
    id: "intro",
    title: "Relay Bridge",
    content:
      "One-click cross-chain bridge to HyperEVM and Hyperliquid. Powered by LI.FI.",
    highlight: "One-click cross-chain bridge",
    subtitle: "Seamless onboarding to Hyperliquid ecosystem",
  },
  {
    id: "problem",
    title: "The Problem",
    content:
      "Users face fragmented liquidity, complex multi-step flows, gas management issues, and no recovery options when bridges fail.",
    highlight: "fragmented liquidity",
    subtitle: "Friction in cross-chain onboarding",
  },
  {
    id: "solution",
    title: "Our Solution",
    content:
      "Dual destination support: Bridge to HyperEVM for DeFi or directly to Hyperliquid for trading. Automatic gas bundling ensures deposits always succeed.",
    highlight: "Dual destination support",
    subtitle: "HyperEVM or Hyperliquid in one click",
  },
  {
    id: "features",
    title: "Key Features",
    content:
      "Failure-resilient UX with transaction persistence • Intelligent gas bundling • Step-by-step progress tracking • Mobile-first design • Auto-deposit to Hyperliquid",
    highlight: "Failure-resilient UX",
    subtitle: "Production-ready bridge experience",
  },
  {
    id: "different",
    title: "Why It's Different",
    content:
      'Gas bundling solves the "no gas on destination" problem. Resume interrupted bridges. Handle partial failures gracefully. Built-in SDK for developers.',
    highlight: "Gas bundling",
    subtitle: "Zero manual steps, maximum reliability",
  },
  {
    id: "tech",
    title: "Built With",
    content:
      "LI.FI SDK for optimal routing • Hyperliquid Bridge2 integration • Pear API for trading pairs • TypeScript SDK package • Mobile-optimized UI",
    highlight: "LI.FI SDK",
    subtitle: "Production-grade technology stack",
  },
  {
    id: "demo",
    title: "See It In Action",
    content:
      "Watch the complete bridge flow from any chain to Hyperliquid with automatic gas management and deposit.",
    highlight: "Watch the complete bridge flow",
    subtitle: "Live demo video",
    isDemo: true,
  },
  {
    id: "cta",
    title: "Ready to Bridge?",
    content:
      "Try Relay Bridge now. Available as live app, NPM package, and open-source on GitHub.",
    highlight: "Try Relay Bridge now",
    subtitle: "Start bridging today",
  },
];

const YOUTUBE_VIDEO_ID = "igsIav8V2Hk";

export default function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastScrollY = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const slideIndex = Math.floor(scrollPosition / windowHeight);
      const newSlide = Math.min(slideIndex, slides.length - 1);

      // Determine scroll direction
      if (scrollPosition > lastScrollY.current) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }
      lastScrollY.current = scrollPosition;

      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    };

    // Use Intersection Observer for better performance
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = slideRefs.current.findIndex(
            (ref) => ref === entry.target
          );
          if (index !== -1 && index !== currentSlide) {
            setCurrentSlide(index);
          }
        }
      });
    }, observerOptions);

    // Observe all slides
    slideRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [currentSlide]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div ref={containerRef} className="relative">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          const isPrevious = index < currentSlide;
          const isNext = index > currentSlide;

          // Calculate animation styles based on position and scroll direction
          let transformStyle = "";
          let opacity = 1;

          if (isActive) {
            // Active slide: centered and fully visible
            transformStyle =
              "translateY(0) translateX(0) rotateY(0deg) scale(1)";
            opacity = 1;
          } else if (isPrevious) {
            // Previous slides: slide up and fade
            transformStyle =
              scrollDirection === "down"
                ? "translateY(-100px) translateX(0) rotateY(-15deg) scale(0.9)"
                : "translateY(100px) translateX(0) rotateY(15deg) scale(0.9)";
            opacity = 0.2;
          } else if (isNext) {
            // Next slides: slide down and fade
            transformStyle =
              scrollDirection === "down"
                ? "translateY(100px) translateX(0) rotateY(15deg) scale(0.9)"
                : "translateY(-100px) translateX(0) rotateY(-15deg) scale(0.9)";
            opacity = 0.2;
          }

          return (
            <section
              key={slide.id}
              className="min-h-screen flex items-center justify-center px-4 md:px-8"
              style={{ scrollSnapAlign: "start" }}
            >
              <div
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
                className="glass-card p-12 md:p-16 max-w-5xl mx-auto text-center"
                style={{
                  transform: transformStyle,
                  opacity: opacity,
                  transition: "all 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                  transformStyle: "preserve-3d",
                  perspective: "1000px",
                }}
              >
                <div className="mb-8">
                  <span className="text-[#03b3c3] text-sm md:text-base font-medium uppercase tracking-wider">
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(slides.length).padStart(2, "0")}
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-black uppercase mb-6 leading-tight">
                  {slide.title === "Why It's Different" ? (
                    <>
                      Why It&apos;s
                      <br />
                      Different
                    </>
                  ) : (
                    slide.title
                  )}
                </h1>

                {slide.subtitle && (
                  <p className="text-lg md:text-xl text-white/60 mb-8 uppercase tracking-wider">
                    {slide.subtitle}
                  </p>
                )}

                {slide.isDemo ? (
                  <div className="mt-8">
                    <div
                      className="relative w-full"
                      style={{ paddingBottom: "56.25%" }}
                    >
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-[#03b3c3]/30"
                        src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1&controls=1&showinfo=0`}
                        title="Relay Bridge Demo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
                      {slide.content}
                    </p>
                  </div>
                ) : (
                  <p className="text-xl md:text-2xl lg:text-3xl text-white/80 leading-relaxed max-w-4xl mx-auto">
                    {slide.content
                      .split(slide.highlight)
                      .map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="text-[#03b3c3] font-semibold">
                              {slide.highlight}
                            </span>
                          )}
                        </span>
                      ))}
                  </p>
                )}

                {slide.id === "cta" && (
                  <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => router.push("/app")}>
                      Launch App
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://www.npmjs.com/package/relay-bridge-sdk",
                          "_blank"
                        )
                      }
                      className="bg-white/5 border border-white/20 hover:bg-white/10"
                    >
                      View SDK
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          "https://github.com/KaushikKC/relay",
                          "_blank"
                        )
                      }
                      className="bg-white/5 border border-white/20 hover:bg-white/10"
                    >
                      GitHub
                    </Button>
                  </div>
                )}

                {/* Progress Indicator */}
                <div className="mt-16 flex justify-center gap-2">
                  {slides.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === currentSlide
                          ? "w-8 bg-[#03b3c3]"
                          : "w-1 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
