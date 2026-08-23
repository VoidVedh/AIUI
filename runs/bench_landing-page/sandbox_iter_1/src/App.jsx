import React from 'react';
import HeaderNavigation from './components/HeaderNavigation.jsx';
import HeroSection from './components/HeroSection.jsx';
import FeaturesGrid from './components/FeaturesGrid.jsx';

export default function App() {
  return (
    <div className="aiui-page" style={{"backgroundColor":"#0F172A","color":"#F8FAFC","fontFamily":"Inter, system-ui, sans-serif"}}>
      <HeaderNavigation />
      <HeroSection />
      <FeaturesGrid />
    </div>
  );
}
