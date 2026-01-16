'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const slides = [
  {
    id: 'vision',
    title: 'Vision',
    content: 'Seamless cross-chain liquidity for the future of decentralized finance.',
    highlight: 'Seamless cross-chain liquidity',
  },
  {
    id: 'problem',
    title: 'Problem',
    content: 'Fragmented liquidity across chains creates friction, high fees, and delays for users moving assets.',
    highlight: 'Fragmented liquidity',
  },
  {
    id: 'solution',
    title: 'Solution',
    content: 'One-click bridge to HyperEVM with automatic routing through LI.FI, eliminating complexity.',
    highlight: 'One-click bridge',
  },
  {
    id: 'different',
    title: 'Why It\'s Different',
    content: 'Direct integration with Hyperliquid enables instant trading post-bridge. No manual steps.',
    highlight: 'Direct integration',
  },
  {
    id: 'tech',
    title: 'Tech Stack',
    content: 'LI.FI SDK for routing • HyperEVM for execution • Hyperliquid for trading • Web3 wallets for access.',
    highlight: 'LI.FI SDK',
  },
  {
    id: 'future',
    title: 'Future',
    content: 'Expand to all major chains. Enable more assets. Build the fastest bridge in DeFi.',
    highlight: 'Fastest bridge',
  },
  {
    id: 'cta',
    title: 'Ready to Bridge?',
    content: 'Start bridging assets to HyperEVM and unlock instant trading on Hyperliquid.',
    highlight: 'Start bridging',
  },
];

export default function AboutPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
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
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      lastScrollY.current = scrollPosition;
      
      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    };

    // Use Intersection Observer for better performance
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = slideRefs.current.findIndex((ref) => ref === entry.target);
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
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
          let transformStyle = '';
          let opacity = 1;
          
          if (isActive) {
            // Active slide: centered and fully visible
            transformStyle = 'translateY(0) translateX(0) rotateY(0deg) scale(1)';
            opacity = 1;
          } else if (isPrevious) {
            // Previous slides: slide up and fade
            transformStyle = scrollDirection === 'down' 
              ? 'translateY(-100px) translateX(0) rotateY(-15deg) scale(0.9)'
              : 'translateY(100px) translateX(0) rotateY(15deg) scale(0.9)';
            opacity = 0.2;
          } else if (isNext) {
            // Next slides: slide down and fade
            transformStyle = scrollDirection === 'down'
              ? 'translateY(100px) translateX(0) rotateY(15deg) scale(0.9)'
              : 'translateY(-100px) translateX(0) rotateY(-15deg) scale(0.9)';
            opacity = 0.2;
          }
          
          return (
            <section
              key={slide.id}
              className="min-h-screen flex items-center justify-center px-4 md:px-8"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
                className="glass-card p-12 md:p-12 max-w-4xl mx-auto text-center"
                style={{
                  transform: transformStyle,
                  opacity: opacity,
                  transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                  transformStyle: 'preserve-3d',
                  perspective: '1000px',
                }}
              >
              <div className="mb-8">
                <span className="text-[#03b3c3] text-sm md:text-base font-medium uppercase tracking-wider">
                  {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-heading font-black uppercase mb-8 leading-tight">
                {slide.title === 'Why It\'s Different' ? (
                  <>
                    Why It&apos;s<br />Different
                  </>
                ) : (
                  slide.title
                )}
              </h1>
              
              <p className="text-xl md:text-2xl lg:text-3xl text-white/80 leading-relaxed max-w-3xl mx-auto">
                {slide.content.split(slide.highlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="text-[#03b3c3] font-semibold">{slide.highlight}</span>
                    )}
                  </span>
                ))}
              </p>

              {slide.id === 'cta' && (
                <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => router.push('/app')}>
                    Launch App
                  </Button>
                 <Link href="/">
                 <Button>
                    Demo
                  </Button>
                  </Link>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="mt-16 flex justify-center gap-2">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? 'w-8 bg-[#03b3c3]'
                        : 'w-1 bg-white/20'
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
