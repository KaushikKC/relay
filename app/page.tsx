'use client';

import Hyperspeed from '@/components/Hyperspeed';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Hyperspeed Background - Full Screen Centered */}
      <div className="fixed inset-0 z-0 h-screen w-screen">
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => {},
            onSlowDown: () => {},
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 3,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0x131318,
              brokenLines: 0x131318,
              leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
              rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
              sticks: 0x03b3c3,
            },
          }}
        />
      </div>

      {/* Content Layer - Navigation and Hero */}
      <div className="relative z-10 h-screen flex flex-col">
        <Navbar />

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 pointer-events-none">
          <div className="pointer-events-auto max-w-5xl w-full text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8 md:mb-12">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="text-white text-sm md:text-base font-medium">One-Click Onboarding with LI.FI</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-10 md:mb-12 text-white uppercase font-bold tracking-wide leading-tight">
              <span className="block">From Any Chain to</span>
              <span className="block whitespace-nowrap">Hyperliquid</span>
              <span className="block">in One Click!</span>
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button onClick={() => router.push('/app')}>
                Get Started
              </Button>
              
              <Button onClick={() => router.push('/about')}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
