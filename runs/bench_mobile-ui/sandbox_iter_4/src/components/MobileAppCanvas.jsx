import React from 'react';

export default function MobileAppCanvas(props) {
  return (
    <section id="sec_0_mobile" style={{"width":"100%","height":"100%","maxWidth":"390px","display":"flex","flexDirection":"column","justifyContent":"space-between","alignItems":"stretch","flexWrap":"nowrap","backgroundColor":"#0F172A","margin":"0px 0px 0px 0px"}}>
      <header id="sec_0_mobile_app_bar" style={{"width":"100%","height":"56px","display":"flex","flexDirection":"row","justifyContent":"center","alignItems":"center","flexWrap":"nowrap","backgroundColor":"#1E293B","border":"1px solid #334155"}}>
        <h2 id="sec_0_mobile_bar_title" style={{"display":"block","color":"#F8FAFC","fontSize":"16px","fontWeight":700}}>
          AIUI Mobile
        </h2>
      </header>
      <div id="sec_0_mobile_card_list" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"stretch","gap":"14px","flexWrap":"nowrap","padding":"20px 16px 20px 16px"}}>
        <article id="sec_0_mobile_mcard_1" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"8px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"18px 18px 18px 18px","border":"1px solid #334155","borderRadius":"12px 12px 12px 12px"}}>
          <h2 id="sec_0_mobile_mcard_1_t" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"15px","fontWeight":600}}>
            Real-time Pipeline
          </h2>
          <p id="sec_0_mobile_mcard_1_b" style={{"width":"100%","display":"block","color":"#94A3B8","fontSize":"13px"}}>
            Optimized mobile layout rendered via unified IR.
          </p>
        </article>
        <article id="sec_0_mobile_mcard_2" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"8px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"18px 18px 18px 18px","border":"1px solid #334155","borderRadius":"12px 12px 12px 12px"}}>
          <h2 id="sec_0_mobile_mcard_2_t" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"15px","fontWeight":600}}>
            Self-Healing Engine
          </h2>
          <p id="sec_0_mobile_mcard_2_b" style={{"width":"100%","display":"block","color":"#94A3B8","fontSize":"13px"}}>
            Optimized mobile layout rendered via unified IR.
          </p>
        </article>
      </div>
      <footer id="sec_0_mobile_bottom_nav" style={{"width":"100%","height":"60px","display":"flex","flexDirection":"row","justifyContent":"space-around","alignItems":"center","flexWrap":"nowrap","backgroundColor":"#1E293B","border":"1px solid #334155"}}>
        <button id="sec_0_mobile_b_tab_1" style={{"display":"flex","flexDirection":"column","justifyContent":"center","alignItems":"center","gap":"4px","flexWrap":"nowrap","color":"#3B82F6","fontSize":"12px","fontWeight":600}}>
          Home
        </button>
        <button id="sec_0_mobile_b_tab_2" style={{"display":"flex","flexDirection":"column","justifyContent":"center","alignItems":"center","gap":"4px","flexWrap":"nowrap","color":"#94A3B8","fontSize":"12px","fontWeight":600}}>
          Activity
        </button>
        <button id="sec_0_mobile_b_tab_3" style={{"display":"flex","flexDirection":"column","justifyContent":"center","alignItems":"center","gap":"4px","flexWrap":"nowrap","color":"#94A3B8","fontSize":"12px","fontWeight":600}}>
          Profile
        </button>
      </footer>
    </section>
  );
}
