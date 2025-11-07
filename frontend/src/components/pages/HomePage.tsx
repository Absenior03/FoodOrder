import React from 'react';
import { Link } from 'react-router-dom';
import { ThreeJSBackground } from '../common/ThreeJSBackground';
import { MouseReactiveElement } from '../common/MouseReactiveElement';
import { MouseTrackingText } from '../common/MouseTrackingText';
import { DynamicText } from '../common/DynamicText';
import { MagneticButton } from '../common/MagneticButton';
import { useAuth } from '../../context/AuthContext';

const HomePage: React.FC = () => {
  const { state } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Three.js Dynamic Background */}
      <ThreeJSBackground />

      <div className="relative z-10">
        {/* Hero Section */}
        <section id="hero" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-40">
          <div className="text-center">
            <MouseTrackingText
              glowColor="#3b82f6"
              glowIntensity={2}
              trackingRadius={300}
              scaleOnHover={true}
            >
              <h1 className="text-6xl md:text-7xl font-bold mb-6 text-blue-600">
                FoodOrder
              </h1>
            </MouseTrackingText>
            
            <DynamicText
              effect="glow"
              intensity={1.5}
              trackingRadius={250}
              className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto"
            >
              Discover delicious food from your favorite restaurants and get it delivered fresh to your door
            </DynamicText>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <MagneticButton
                magneticStrength={0.4}
                magneticRadius={120}
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Link to="/menu" className="flex items-center space-x-2">
                  <span>Browse Menu</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </MagneticButton>

              {state.isAuthenticated && (
                <MagneticButton
                  magneticStrength={0.3}
                  magneticRadius={100}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl border border-blue-200 transition-all duration-300"
                >
                  <Link to="/orders" className="flex items-center space-x-2">
                    <span>My Orders</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </Link>
                </MagneticButton>
              )}
            </div>
          </div>
        </section>

        {/* Food Gallery Section */}
        <section id="gallery" className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <MouseTrackingText
                glowColor="#f59e0b"
                glowIntensity={2.2}
                trackingRadius={320}
                className="text-5xl md:text-6xl font-bold text-amber-900 mb-6"
              >
                Delicious Food Awaits
              </MouseTrackingText>
              <DynamicText
                effect="shimmer"
                intensity={1.5}
                trackingRadius={250}
                className="text-xl md:text-2xl text-amber-800 mb-4"
              >
                Explore our mouth-watering selection
              </DynamicText>
              <p className="text-amber-700 max-w-2xl mx-auto text-lg">
                From authentic Italian pizzas to fresh sushi rolls, discover flavors from around the world
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {/* Food Item 1 - Pizza */}
              <MouseReactiveElement
                intensity={1.4}
                magneticRadius={200}
                tiltStrength={12}
                glowIntensity={0.5}
                className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="h-80 bg-gradient-to-br from-red-400 via-orange-500 to-red-600 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">🍕</div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">₹450</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-orange-300 transition-colors">Margherita Pizza</h3>
                  <p className="text-white/90 mb-4 text-lg">Hand-tossed with fresh mozzarella, basil & tomato sauce</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                      <span className="text-sm">(4.9)</span>
                    </div>
                    <span className="bg-orange-500 px-3 py-1 rounded-full text-sm font-semibold">Popular</span>
                  </div>
                </div>
              </MouseReactiveElement>

              {/* Food Item 2 - Burger */}
              <MouseReactiveElement
                intensity={1.4}
                magneticRadius={200}
                tiltStrength={12}
                glowIntensity={0.5}
                className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="h-80 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">🍔</div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">₹320</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-yellow-300 transition-colors">Chicken Burger Deluxe</h3>
                  <p className="text-white/90 mb-4 text-lg">Grilled chicken breast with lettuce, tomato & special sauce</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                      <span className="text-sm">(4.8)</span>
                    </div>
                    <span className="bg-green-500 px-3 py-1 rounded-full text-sm font-semibold">Fresh</span>
                  </div>
                </div>
              </MouseReactiveElement>

              {/* Food Item 3 - Ramen */}
              <MouseReactiveElement
                intensity={1.4}
                magneticRadius={200}
                tiltStrength={12}
                glowIntensity={0.5}
                className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="h-80 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">🍜</div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">₹380</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-orange-300 transition-colors">Chicken Ramen Bowl</h3>
                  <p className="text-white/90 mb-4 text-lg">Rich broth with fresh noodles, egg & vegetables</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                      <span className="text-sm">(4.7)</span>
                    </div>
                    <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-semibold">Comfort</span>
                  </div>
                </div>
              </MouseReactiveElement>

              {/* Food Item 4 - Pasta */}
              <MouseReactiveElement
                intensity={1.4}
                magneticRadius={200}
                tiltStrength={12}
                glowIntensity={0.5}
                className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="h-80 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">🍝</div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">₹420</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-green-300 transition-colors">Spaghetti Carbonara</h3>
                  <p className="text-white/90 mb-4 text-lg">Classic Italian pasta with eggs, cheese & pancetta</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                      <span className="text-sm">(4.9)</span>
                    </div>
                    <span className="bg-purple-500 px-3 py-1 rounded-full text-sm font-semibold">Classic</span>
                  </div>
                </div>
              </MouseReactiveElement>

              {/* Food Item 5 - Tacos */}
              <MouseReactiveElement
                intensity={1.4}
                magneticRadius={200}
                tiltStrength={12}
                glowIntensity={0.5}
                className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="h-80 bg-gradient-to-br from-lime-400 via-green-500 to-emerald-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">🌮</div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">₹350</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-lime-300 transition-colors">Beef Tacos (3 pcs)</h3>
                  <p className="text-white/90 mb-4 text-lg">Street-style tacos with seasoned beef & fresh toppings</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                      <span className="text-sm">(4.6)</span>
                    </div>
                    <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-semibold">Spicy</span>
                  </div>
                </div>
              </MouseReactiveElement>

              {/* Food Item 6 - Dessert */}
              <MouseReactiveElement
                intensity={1.4}
                magneticRadius={200}
                tiltStrength={12}
                glowIntensity={0.5}
                className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="h-80 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-8xl transform group-hover:scale-110 transition-transform duration-300">🍰</div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">₹220</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-pink-300 transition-colors">Chocolate Lava Cake</h3>
                  <p className="text-white/90 mb-4 text-lg">Warm cake with molten center & vanilla ice cream</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                      <span className="text-sm">(4.8)</span>
                    </div>
                    <span className="bg-pink-500 px-3 py-1 rounded-full text-sm font-semibold">Sweet</span>
                  </div>
                </div>
              </MouseReactiveElement>
            </div>

            {/* Browse Menu CTA */}
            <div className="text-center">
              <MagneticButton
                magneticStrength={0.5}
                magneticRadius={150}
                className="px-12 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              >
                <Link to="/menu" className="flex items-center space-x-3">
                  <span>Explore Full Menu</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </MagneticButton>
              <p className="mt-4 text-amber-700 text-lg">
                Over 50+ dishes available for delivery
              </p>
            </div>
          </div>
        </section>

        {/* Popular Dishes Section */}
        <section id="popular" className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <MouseTrackingText
                glowColor="#3b82f6"
                glowIntensity={1.8}
                trackingRadius={280}
                className="text-4xl font-bold text-blue-800 mb-4"
              >
                Today's Popular Dishes
              </MouseTrackingText>
              <DynamicText
                effect="shimmer"
                intensity={1.2}
                trackingRadius={200}
                className="text-xl text-blue-700"
              >
                Most ordered items by our customers
              </DynamicText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Popular Item 1 */}
              <MouseReactiveElement
                intensity={1.2}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-4">🍕</div>
                <h4 className="font-semibold text-gray-800 mb-2">Margherita Pizza</h4>
                <p className="text-sm text-gray-600 mb-3">Classic tomato, mozzarella & basil</p>
                <div className="flex items-center justify-center space-x-1 text-yellow-400">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="text-gray-600 text-sm">(4.9)</span>
                </div>
              </MouseReactiveElement>

              {/* Popular Item 2 */}
              <MouseReactiveElement
                intensity={1.2}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-4">🍔</div>
                <h4 className="font-semibold text-gray-800 mb-2">Classic Burger</h4>
                <p className="text-sm text-gray-600 mb-3">Beef patty, lettuce, tomato & cheese</p>
                <div className="flex items-center justify-center space-x-1 text-yellow-400">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="text-gray-600 text-sm">(4.8)</span>
                </div>
              </MouseReactiveElement>

              {/* Popular Item 3 */}
              <MouseReactiveElement
                intensity={1.2}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-4">🍜</div>
                <h4 className="font-semibold text-gray-800 mb-2">Ramen Bowl</h4>
                <p className="text-sm text-gray-600 mb-3">Rich broth with fresh noodles</p>
                <div className="flex items-center justify-center space-x-1 text-yellow-400">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="text-gray-600 text-sm">(4.7)</span>
                </div>
              </MouseReactiveElement>

              {/* Popular Item 4 */}
              <MouseReactiveElement
                intensity={1.2}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-4">🥗</div>
                <h4 className="font-semibold text-gray-800 mb-2">Caesar Salad</h4>
                <p className="text-sm text-gray-600 mb-3">Fresh greens with parmesan</p>
                <div className="flex items-center justify-center space-x-1 text-yellow-400">
                  <span>⭐⭐⭐⭐⭐</span>
                  <span className="text-gray-600 text-sm">(4.6)</span>
                </div>
              </MouseReactiveElement>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center mb-16">
            <MouseTrackingText
              glowColor="#8b5cf6"
              glowIntensity={1.8}
              trackingRadius={280}
              className="text-4xl font-bold text-purple-800 mb-4"
            >
              Why Choose FoodOrder?
            </MouseTrackingText>
            <DynamicText
              effect="shimmer"
              intensity={1.2}
              trackingRadius={200}
              className="text-xl text-purple-700"
            >
              Experience the future of food delivery
            </DynamicText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <MouseReactiveElement
              intensity={1.2}
              magneticRadius={200}
              tiltStrength={12}
              glowIntensity={0.4}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl h-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <MouseTrackingText
                  glowColor="#3b82f6"
                  glowIntensity={1.5}
                  trackingRadius={150}
                  className="text-2xl font-semibold text-purple-800 mb-4"
                >
                  Lightning Fast
                </MouseTrackingText>
                <DynamicText
                  effect="glow"
                  intensity={1}
                  trackingRadius={120}
                  className="text-purple-700"
                >
                  Get your food delivered in 30 minutes or less with our optimized delivery network
                </DynamicText>
              </div>
            </MouseReactiveElement>

            {/* Feature 2 */}
            <MouseReactiveElement
              intensity={1.2}
              magneticRadius={200}
              tiltStrength={12}
              glowIntensity={0.4}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl h-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <MouseTrackingText
                  glowColor="#8b5cf6"
                  glowIntensity={1.5}
                  trackingRadius={150}
                  className="text-2xl font-semibold text-purple-800 mb-4"
                >
                  Fresh & Quality
                </MouseTrackingText>
                <DynamicText
                  effect="glow"
                  intensity={1}
                  trackingRadius={120}
                  className="text-purple-700"
                >
                  We partner with the best restaurants to ensure every meal is fresh and delicious
                </DynamicText>
              </div>
            </MouseReactiveElement>

            {/* Feature 3 */}
            <MouseReactiveElement
              intensity={1.2}
              magneticRadius={200}
              tiltStrength={12}
              glowIntensity={0.4}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl h-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <MouseTrackingText
                  glowColor="#10b981"
                  glowIntensity={1.5}
                  trackingRadius={150}
                  className="text-2xl font-semibold text-purple-800 mb-4"
                >
                  Easy Ordering
                </MouseTrackingText>
                <DynamicText
                  effect="glow"
                  intensity={1}
                  trackingRadius={120}
                  className="text-purple-700"
                >
                  Simple, intuitive interface with real-time tracking and secure payments
                </DynamicText>
              </div>
            </MouseReactiveElement>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <MouseReactiveElement
                intensity={0.8}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="p-6"
              >
                <DynamicText
                  effect="gradient-shift"
                  intensity={2}
                  trackingRadius={100}
                  className="text-4xl font-bold text-green-700 mb-2"
                >
                  1000+
                </DynamicText>
                <MouseTrackingText
                  glowColor="#10b981"
                  glowIntensity={1}
                  trackingRadius={80}
                  className="text-green-600"
                >
                  Happy Customers
                </MouseTrackingText>
              </MouseReactiveElement>
              
              <MouseReactiveElement
                intensity={0.8}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="p-6"
              >
                <DynamicText
                  effect="gradient-shift"
                  intensity={2}
                  trackingRadius={100}
                  className="text-4xl font-bold text-green-700 mb-2"
                >
                  50+
                </DynamicText>
                <MouseTrackingText
                  glowColor="#10b981"
                  glowIntensity={1}
                  trackingRadius={80}
                  className="text-green-600"
                >
                  Restaurant Partners
                </MouseTrackingText>
              </MouseReactiveElement>
              
              <MouseReactiveElement
                intensity={0.8}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="p-6"
              >
                <DynamicText
                  effect="gradient-shift"
                  intensity={2}
                  trackingRadius={100}
                  className="text-4xl font-bold text-green-700 mb-2"
                >
                  25min
                </DynamicText>
                <MouseTrackingText
                  glowColor="#10b981"
                  glowIntensity={1}
                  trackingRadius={80}
                  className="text-green-600"
                >
                  Average Delivery
                </MouseTrackingText>
              </MouseReactiveElement>
              
              <MouseReactiveElement
                intensity={0.8}
                magneticRadius={150}
                tiltStrength={8}
                glowIntensity={0.3}
                className="p-6"
              >
                <DynamicText
                  effect="gradient-shift"
                  intensity={2}
                  trackingRadius={100}
                  className="text-4xl font-bold text-green-700 mb-2"
                >
                  4.9★
                </DynamicText>
                <MouseTrackingText
                  glowColor="#10b981"
                  glowIntensity={1}
                  trackingRadius={80}
                  className="text-green-600"
                >
                  Customer Rating
                </MouseTrackingText>
              </MouseReactiveElement>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <MouseReactiveElement
            intensity={1.5}
            magneticRadius={300}
            tiltStrength={10}
            glowIntensity={0.5}
            className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center shadow-2xl"
          >
            <MouseTrackingText
              glowColor="#dc2626"
              glowIntensity={2.5}
              trackingRadius={350}
              scaleOnHover={true}
              className="text-4xl font-bold mb-6 text-red-800"
            >
              Ready to Order?
            </MouseTrackingText>
            
            <DynamicText
              effect="wave"
              intensity={1.5}
              trackingRadius={300}
              className="text-xl mb-8 text-red-700"
            >
              {state.isAuthenticated 
                ? `Welcome back! Browse our menu and place your order.`
                : `Join thousands of satisfied customers and get your first meal delivered today.`
              }
            </DynamicText>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton
                magneticStrength={0.5}
                magneticRadius={150}
                className="px-8 py-4 bg-red-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Link to="/menu">
                  {state.isAuthenticated ? 'Browse Menu' : 'View Menu'}
                </Link>
              </MagneticButton>
            </div>
          </MouseReactiveElement>
        </section>
      </div>
    </div>
  );
};

export default HomePage;