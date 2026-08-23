import React from 'react';

export default function FormSection(props) {
  return (
    <section id="sec_1_form" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"center","alignItems":"center","flexWrap":"nowrap","padding":"60px 24px 80px 24px"}}>
      <article id="sec_1_form_card" style={{"width":"100%","maxWidth":"440px","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"stretch","gap":"18px","flexWrap":"nowrap","backgroundColor":"#1E293B","padding":"36px 32px 36px 32px","border":"1px solid #334155","borderRadius":"16px 16px 16px 16px","boxShadow":"0 10px 25px -5px rgba(0, 0, 0, 0.3)"}}>
        <h2 id="sec_1_form_title" style={{"width":"100%","display":"block","color":"#F8FAFC","fontSize":"24px","fontWeight":700}}>
          Create Your Account
        </h2>
        <p id="sec_1_form_sub" style={{"width":"100%","display":"block","color":"#94A3B8","fontSize":"14px"}}>
          Join thousands of developers using AIUI.
        </p>
        <form id="sec_1_form_form" style={{"width":"100%","display":"flex","flexDirection":"column","justifyContent":"flex-start","alignItems":"stretch","gap":"14px","flexWrap":"nowrap"}}>
          <input type="text" placeholder="Full Name" style={{"width":"100%","height":"44px","display":"block","backgroundColor":"#0F172A","color":"#F8FAFC","fontSize":"14px","padding":"10px 14px 10px 14px","border":"1px solid #334155","borderRadius":"8px 8px 8px 8px"}} id="sec_1_form_name_inp" />
          <input type="email" placeholder="Email address" style={{"width":"100%","height":"44px","display":"block","backgroundColor":"#0F172A","color":"#F8FAFC","fontSize":"14px","padding":"10px 14px 10px 14px","border":"1px solid #334155","borderRadius":"8px 8px 8px 8px"}} id="sec_1_form_email_inp" />
          <input type="password" placeholder="Password" style={{"width":"100%","height":"44px","display":"block","backgroundColor":"#0F172A","color":"#F8FAFC","fontSize":"14px","padding":"10px 14px 10px 14px","border":"1px solid #334155","borderRadius":"8px 8px 8px 8px"}} id="sec_1_form_pass_inp" />
          <button id="sec_1_form_submit_btn" style={{"width":"100%","height":"44px","display":"flex","flexDirection":"row","justifyContent":"center","alignItems":"center","gap":"8px","flexWrap":"nowrap","backgroundColor":"#3B82F6","color":"#FFFFFF","fontSize":"15px","fontWeight":600,"padding":"10px 20px 10px 20px","margin":"6px 0px 0px 0px","borderRadius":"8px 8px 8px 8px"}}>
            Sign Up Free
          </button>
        </form>
      </article>
    </section>
  );
}
