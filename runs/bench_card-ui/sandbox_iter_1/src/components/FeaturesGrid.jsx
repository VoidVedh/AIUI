import React from 'react';
import { Layers, Zap, Activity } from 'lucide-react';

export default function FeaturesGrid(props) {
  return (
    <section id="sec_1_card-grid" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"center","flexWrap":"nowrap","padding":"40px 24px 60px 24px"}}>
      <div id="sec_1_card-grid_container" style={{"width":"100%","maxWidth":"1140px","display":"grid","gridTemplateColumns":"repeat(auto-fit, minmax(320px, 1fr))","gap":"24px"}}>
        <article id="sec_1_card-grid_card_0" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"12px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"28px 28px 28px 28px","border":"1px solid #334155","borderRadius":"12px 12px 12px 12px","boxShadow":"0 4px 6px -1px rgba(0, 0, 0, 0.1)"}}>
          <Layers size={24} style={{"width":"24px","height":"24px","display":"block","color":"#3B82F6"}} id="sec_1_card-grid_card_0_icon" />
          <h2 id="sec_1_card-grid_card_0_title" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"18px","fontWeight":600}}>
            Structured UI IR
          </h2>
          <p id="sec_1_card-grid_card_0_desc" style={{"width":"100%","display":"block","color":"#94A3B8","fontSize":"14px","lineHeight":1.5}}>
            Framework-agnostic intermediate language isolating vision perception from code output.
          </p>
        </article>
        <article id="sec_1_card-grid_card_1" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"12px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"28px 28px 28px 28px","border":"1px solid #334155","borderRadius":"12px 12px 12px 12px","boxShadow":"0 4px 6px -1px rgba(0, 0, 0, 0.1)"}}>
          <Zap size={24} style={{"width":"24px","height":"24px","display":"block","color":"#3B82F6"}} id="sec_1_card-grid_card_1_icon" />
          <h2 id="sec_1_card-grid_card_1_title" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"18px","fontWeight":600}}>
            Multi-Target Generators
          </h2>
          <p id="sec_1_card-grid_card_1_desc" style={{"width":"100%","display":"block","color":"#94A3B8","fontSize":"14px","lineHeight":1.5}}>
            Synthesizes idiomatic React 19, Vanilla JS, and Flutter from a single analyzed tree.
          </p>
        </article>
        <article id="sec_1_card-grid_card_2" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"12px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"28px 28px 28px 28px","border":"1px solid #334155","borderRadius":"12px 12px 12px 12px","boxShadow":"0 4px 6px -1px rgba(0, 0, 0, 0.1)"}}>
          <Activity size={24} style={{"width":"24px","height":"24px","display":"block","color":"#3B82F6"}} id="sec_1_card-grid_card_2_icon" />
          <h2 id="sec_1_card-grid_card_2_title" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"18px","fontWeight":600}}>
            Self-Correction Loop
          </h2>
          <p id="sec_1_card-grid_card_2_desc" style={{"width":"100%","display":"block","color":"#94A3B8","fontSize":"14px","lineHeight":1.5}}>
            Calculates real SSIM and pixelmatch metrics with targeted surgical CSS/JSX patch engine.
          </p>
        </article>
      </div>
    </section>
  );
}
