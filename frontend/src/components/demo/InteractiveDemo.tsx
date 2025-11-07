import React, { useState } from 'react';
import { MouseInteractive } from '../common/MouseInteractive';
import { InteractiveBackground } from '../common/InteractiveBackground';
import { MagneticButton } from '../common/MagneticButton';
import { CursorTrail } from '../common/CursorTrail';
import { CustomCursor } from '../common/CustomCursor';

export const InteractiveDemo: React.FC = () => {
  const [showTrail, setShowTrail] = useState(false);
  const [particleCount, setParticleCount] = useState(50);
  const [customCursor, setCustomCursor] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Interactive Background */}
      <InteractiveBackground 
        particleCount={particleCount}
        mouseInfluence={120}
        colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']}
      />

      {/* Custom Cursor */}
      <CustomCursor enabled={customCursor} />

      {/* Cursor Trail */}
      {showTrail && (
        <CursorTrail
          trailLength={15}
          trailWidth={8}
          trailColor="#60a5fa"
          fadeTime={800}
        />
      )}

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Interactive UI/UX Demo
          </h1>
          <p className="text-xl text-gray-300">
            Move your mouse around to see the magic happen
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-12">
          <MagneticButton
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
            onClick={() => setShowTrail(!showTrail)}
            magneticStrength={0.4}
            magneticRadius={80}
          >
            {showTrail ? 'Hide' : 'Show'} Cursor Trail
          </MagneticButton>

          <MagneticButton
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold"
            onClick={() => setParticleCount(prev => prev === 50 ? 100 : 50)}
            magneticStrength={0.3}
            magneticRadius={100}
          >
            {particleCount === 50 ? 'More' : 'Fewer'} Particles
          </MagneticButton>

          <MagneticButton
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold"
            onClick={() => setCustomCursor(!customCursor)}
            magneticStrength={0.3}
            magneticRadius={100}
          >
            {customCursor ? 'Default' : 'Custom'} Cursor
          </MagneticButton>
        </div>

        {/* Interactive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1: Tilt Effect */}
          <MouseInteractive
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            enableTilt={true}
            enableGlow={true}
            enableParticles={false}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">3D Tilt Effect</h3>
              <p className="text-gray-300">Hover to see the card tilt in 3D space</p>
            </div>
          </MouseInteractive>

          {/* Card 2: Particle Effect */}
          <MouseInteractive
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            enableTilt={false}
            enableGlow={false}
            enableParticles={true}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Particle Trail</h3>
              <p className="text-gray-300">Move your mouse to create particles</p>
            </div>
          </MouseInteractive>

          {/* Card 3: Glow Effect */}
          <MouseInteractive
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            enableTilt={false}
            enableGlow={true}
            enableParticles={false}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-red-500 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Dynamic Glow</h3>
              <p className="text-gray-300">Watch the glow follow your cursor</p>
            </div>
          </MouseInteractive>

          {/* Card 4: All Effects */}
          <MouseInteractive
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 md:col-span-2 lg:col-span-1"
            enableTilt={true}
            enableGlow={true}
            enableParticles={true}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">All Effects</h3>
              <p className="text-gray-300">Experience all interactions combined</p>
            </div>
          </MouseInteractive>

          {/* Card 5: Magnetic Buttons */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 md:col-span-2">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Magnetic Buttons</h3>
              <p className="text-gray-300 mb-6">These buttons are attracted to your cursor</p>
              <div className="flex flex-wrap justify-center gap-4">
                <MagneticButton
                  className="px-4 py-2 bg-red-500 text-white rounded-lg"
                  magneticStrength={0.5}
                  magneticRadius={60}
                >
                  Strong Pull
                </MagneticButton>
                <MagneticButton
                  className="px-4 py-2 bg-green-500 text-white rounded-lg"
                  magneticStrength={0.2}
                  magneticRadius={100}
                >
                  Gentle Pull
                </MagneticButton>
                <MagneticButton
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                  magneticStrength={0.3}
                  magneticRadius={80}
                >
                  Medium Pull
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-400">
            These interactive components can be integrated into your food ordering platform
            to create engaging user experiences.
          </p>
        </div>
      </div>
    </div>
  );
};