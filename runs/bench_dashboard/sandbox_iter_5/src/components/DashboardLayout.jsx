import React from 'react';

export default function DashboardLayout(props) {
  return (
    <section id="sec_1_dashboard" style={{"width":"100%","height":"100%","display":"flex","flexDirection":"row","justifyContent":"flex-start","alignItems":"stretch","flexWrap":"nowrap"}}>
      <aside id="sec_1_dashboard_sidebar" style={{"width":"240px","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"stretch","gap":"8px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"24px 16px 24px 16px","border":"1px solid #334155"}}>
        <button id="sec_1_dashboard_nav_1" style={{"width":"100%","height":"38px","display":"flex","flexDirection":"row","justifyContent":"flex-start","alignItems":"center","gap":"12px","flexWrap":"nowrap","backgroundColor":"rgba(59, 130, 246, 0.15)","color":"#3B82F6","fontSize":"14px","fontWeight":600,"padding":"8px 12px 8px 12px","borderRadius":"6px 6px 6px 6px"}}>
          Overview
        </button>
        <button id="sec_1_dashboard_nav_2" style={{"width":"100%","height":"38px","display":"flex","flexDirection":"row","justifyContent":"flex-start","alignItems":"center","gap":"12px","flexWrap":"nowrap","backgroundColor":"transparent","color":"#94A3B8","fontSize":"14px","fontWeight":500,"padding":"8px 12px 8px 12px","borderRadius":"6px 6px 6px 6px"}}>
          Analytics
        </button>
        <button id="sec_1_dashboard_nav_3" style={{"width":"100%","height":"38px","display":"flex","flexDirection":"row","justifyContent":"flex-start","alignItems":"center","gap":"12px","flexWrap":"nowrap","backgroundColor":"transparent","color":"#94A3B8","fontSize":"14px","fontWeight":500,"padding":"8px 12px 8px 12px","borderRadius":"6px 6px 6px 6px"}}>
          Reports
        </button>
        <button id="sec_1_dashboard_nav_4" style={{"width":"100%","height":"38px","display":"flex","flexDirection":"row","justifyContent":"flex-start","alignItems":"center","gap":"12px","flexWrap":"nowrap","backgroundColor":"transparent","color":"#94A3B8","fontSize":"14px","fontWeight":500,"padding":"8px 12px 8px 12px","borderRadius":"6px 6px 6px 6px"}}>
          Settings
        </button>
      </aside>
      <div id="sec_1_dashboard_main_panel" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"stretch","gap":"24px","flexWrap":"nowrap","padding":"28px 28px 28px 28px"}}>
        <div id="sec_1_dashboard_stats_grid" style={{"width":"100%","display":"grid","gridTemplateColumns":"repeat(3, 1fr)","gap":"20px"}}>
          <article id="sec_1_dashboard_stat_1" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"6px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"20px 20px 20px 20px","border":"1px solid #334155","borderRadius":"10px 10px 10px 10px"}}>
            <p id="sec_1_dashboard_stat_1_lbl" style={{"display":"block","color":"#94A3B8","fontSize":"13px"}}>
              Total Revenue
            </p>
            <h2 id="sec_1_dashboard_stat_1_val" style={{"display":"block","color":"#F8FAFC","fontSize":"24px","fontWeight":700}}>
              $124,500
            </h2>
            <p id="sec_1_dashboard_stat_1_diff" style={{"display":"block","color":"#10B981","fontSize":"12px","fontWeight":600}}>
              +14.2%
            </p>
          </article>
          <article id="sec_1_dashboard_stat_2" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"6px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"20px 20px 20px 20px","border":"1px solid #334155","borderRadius":"10px 10px 10px 10px"}}>
            <p id="sec_1_dashboard_stat_2_lbl" style={{"display":"block","color":"#94A3B8","fontSize":"13px"}}>
              Active Pipelines
            </p>
            <h2 id="sec_1_dashboard_stat_2_val" style={{"display":"block","color":"#F8FAFC","fontSize":"24px","fontWeight":700}}>
              842
            </h2>
            <p id="sec_1_dashboard_stat_2_diff" style={{"display":"block","color":"#10B981","fontSize":"12px","fontWeight":600}}>
              +8.7%
            </p>
          </article>
          <article id="sec_1_dashboard_stat_3" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"flex-start","gap":"6px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"20px 20px 20px 20px","border":"1px solid #334155","borderRadius":"10px 10px 10px 10px"}}>
            <p id="sec_1_dashboard_stat_3_lbl" style={{"display":"block","color":"#94A3B8","fontSize":"13px"}}>
              Avg Similarity Score
            </p>
            <h2 id="sec_1_dashboard_stat_3_val" style={{"display":"block","color":"#F8FAFC","fontSize":"24px","fontWeight":700}}>
              94.6%
            </h2>
            <p id="sec_1_dashboard_stat_3_diff" style={{"display":"block","color":"#10B981","fontSize":"12px","fontWeight":600}}>
              +3.1%
            </p>
          </article>
        </div>
        <article id="sec_1_dashboard_chart_card" style={{"width":"100%","height":"320px","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"stretch","gap":"16px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"24px 24px 24px 24px","border":"1px solid #334155","borderRadius":"12px 12px 12px 12px"}}>
          <h2 id="sec_1_dashboard_chart_hdr" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"16px","fontWeight":600}}>
            Performance Convergence Analytics
          </h2>
          <div id="sec_1_dashboard_chart_body" style={{"width":"100%","height":"100%","display":"flex","flexDirection":"row","justifyContent":"space-between","alignItems":"flex-end","gap":"16px","flexWrap":"nowrap","backgroundColor":"rgba(15, 23, 42, 0.6)","padding":"20px 20px 20px 20px","borderRadius":"8px 8px 8px 8px"}} />
        </article>
      </div>
    </section>
  );
}
