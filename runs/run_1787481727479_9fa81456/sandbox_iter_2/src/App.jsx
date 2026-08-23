import React from 'react';
import HeaderNavigation from './components/HeaderNavigation.jsx';
import DensePricingFeatureMatrix from './components/DensePricingFeatureMatrix.jsx';

export default function App() {
  return (
    <div className="aiui-page" style={{"backgroundColor":"#0F172A","color":"#F8FAFC","fontFamily":"Inter, system-ui, sans-serif"}}>
      <HeaderNavigation />
      <DensePricingFeatureMatrix />
    </div>
  );
}
