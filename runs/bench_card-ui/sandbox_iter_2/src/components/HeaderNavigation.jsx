import React from 'react';

export default function HeaderNavigation(props) {
  return (
    <header id="sec_0_navbar" style={{"width":"100%","height":"72px","display":"flex","flexDirection":"row","justifyContent":"space-between","alignItems":"center","gap":"24px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"16px 32px 16px 32px","border":"1px solid #334155"}}>
      <h2 id="sec_0_navbar_logo" style={{"display":"block","color":"#F8FAFC","fontSize":"20px","fontWeight":700,"letterSpacing":"-0.02em"}}>
        AIUI Architecture
      </h2>
      <div id="sec_0_navbar_nav_links" style={{"display":"flex","flexDirection":"row","justifyContent":"flex-start","alignItems":"center","gap":"28px","flexWrap":"nowrap"}}>
        <p id="sec_0_navbar_link_1" style={{"display":"block","color":"#94A3B8","fontSize":"14px","fontWeight":500}}>
          Features
        </p>
        <p id="sec_0_navbar_link_2" style={{"display":"block","color":"#94A3B8","fontSize":"14px","fontWeight":500}}>
          Solutions
        </p>
        <p id="sec_0_navbar_link_3" style={{"display":"block","color":"#94A3B8","fontSize":"14px","fontWeight":500}}>
          Pricing
        </p>
      </div>
      <button id="sec_0_navbar_actions" style={{"height":"40px","display":"flex","flexDirection":"row","justifyContent":"center","alignItems":"center","gap":"8px","flexWrap":"nowrap","backgroundColor":"#3B82F6","color":"#FFFFFF","fontSize":"14px","fontWeight":600,"padding":"8px 18px 8px 18px","borderRadius":"8px 8px 8px 8px","boxShadow":"0 4px 12px rgba(59, 130, 246, 0.25)"}}>
        Explore
      </button>
    </header>
  );
}
