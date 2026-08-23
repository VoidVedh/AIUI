import React from 'react';

export default function HeroSection(props) {
  return (
    <section id="sec_1_hero" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"center","alignItems":"center","gap":"20px","flexWrap":"nowrap","textAlign":"center","padding":"80px 24px 60px 24px"}}>
      <div id="sec_1_hero_content" style={{"width":"100%","maxWidth":"840px","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"center","gap":"16px","flexWrap":"nowrap","textAlign":"center"}}>
        <span id="sec_1_hero_badge" style={{"display":"inline-block","backgroundColor":"rgba(59, 130, 246, 0.15)","color":"#3B82F6","fontSize":"12px","fontWeight":600,"padding":"6px 14px 6px 14px","border":"1px solid rgba(59, 130, 246, 0.3)","borderRadius":"9999px 9999px 9999px 9999px"}}>
          ✦ Next-Gen Autonomous UI Engineering
        </span>
        <h2 id="sec_1_hero_heading" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"44px","fontWeight":800,"lineHeight":1.15,"letterSpacing":"-0.03em"}}>
          Transform Screenshots Into Pixel-Perfect Production Code
        </h2>
        <p id="sec_1_hero_subheading" style={{"width":"100%","maxWidth":"640px","display":"block","color":"#94A3B8","fontSize":"18px","lineHeight":1.6}}>
          AIUI autonomously analyzes UI design, extracts design tokens, builds component trees, and self-corrects using computer vision.
        </p>
        <div id="sec_1_hero_cta_group" style={{"display":"flex","flexDirection":"row","justifyContent":"center","alignItems":"center","gap":"16px","flexWrap":"nowrap","margin":"12px 0px 0px 0px"}}>
          <button id="sec_1_hero_btn_primary" style={{"height":"48px","display":"flex","flexDirection":"row","justifyContent":"center","alignItems":"center","gap":"8px","flexWrap":"nowrap","backgroundColor":"#3B82F6","color":"#FFFFFF","fontSize":"15px","fontWeight":600,"padding":"12px 28px 12px 28px","borderRadius":"10px 10px 10px 10px"}}>
            Start Building Now
          </button>
          <button id="sec_1_hero_btn_secondary" style={{"height":"48px","display":"flex","flexDirection":"row","justifyContent":"center","alignItems":"center","gap":"8px","flexWrap":"nowrap","backgroundColor":"rgba(30, 41, 59, 0.8)","color":"#F8FAFC","fontSize":"15px","fontWeight":600,"padding":"12px 24px 12px 24px","border":"1px solid #334155","borderRadius":"10px 10px 10px 10px"}}>
            View Documentation
          </button>
        </div>
      </div>
    </section>
  );
}
