import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { Shield, Lock, User, BadgeCheck, ChevronRight, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      await login(values.badge_no, values.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Invalid badge number or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (badgeNo) => {
    form.setFieldsValue({
      badge_no: badgeNo,
      password: 'test123'
    });
    form.submit();
  };

  const features = [
    { text: 'Live jurisdiction-scoped crime analytics', accent: 'bg-amber-400/20 border-amber-400/30 text-amber-300' },
    { text: 'Station-wise FIR & PCR workflow management', accent: 'bg-blue-400/20 border-blue-400/30 text-blue-300' },
    { text: 'Role-based access for HC, SHO, DCP & HQ', accent: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-300' },
  ];

  const quickLogins = [
    { label: 'HC',         badge: 'HC001',  color: 'text-blue-500',   ring: 'hover:border-blue-200   hover:bg-blue-50' },
    { label: 'SHO',        badge: 'SHO001', color: 'text-emerald-500',ring: 'hover:border-emerald-200 hover:bg-emerald-50' },
    { label: 'DCP',        badge: 'DO001',  color: 'text-amber-500',  ring: 'hover:border-amber-200  hover:bg-amber-50' },
    { label: 'HQ Analyst', badge: 'HQ001',  color: 'text-violet-500', ring: 'hover:border-violet-200 hover:bg-violet-50' },
    { label: 'HQ Admin',   badge: 'HQ002',  color: 'text-pink-500',   ring: 'hover:border-pink-200   hover:bg-pink-50' },
    { label: 'SysAdmin',   badge: 'SA001',  color: 'text-rose-500',   ring: 'hover:border-rose-200   hover:bg-rose-50' },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans">

      {/* ════════════════════════════════════════════════════════════════════════
          LEFT PANEL — dark command aesthetic
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:flex-col overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #080f1c 0%, #0c1a30 40%, #0a2240 100%)' }}
      >
        {/* ── Background layers ── */}
        {/* Fine dot-grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Amber top-left glow */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)' }}
        />
        {/* Blue bottom-right glow */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }}
        />
        {/* Horizontal rule accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center flex-1 px-12 pt-16 pb-10">

          {/* Brand lockup */}
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl opacity-60"
                style={{ background: 'rgba(251,191,36,0.35)' }}
              />
              <Shield
                size={52}
                className="relative text-amber-400"
                fill="rgba(251,191,36,0.18)"
                strokeWidth={1.5}
              />
            </div>
            <div className="flex flex-col items-start">
              <span
                className="text-[2.6rem] font-black leading-none tracking-[0.28em]"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                PHAROS
              </span>
              <span className="text-[10px] font-bold tracking-[0.35em] text-amber-400/80 uppercase mt-0.5">
                Command System
              </span>
            </div>
          </div>

          {/* Amber rule */}
          <div className="flex items-center gap-3 my-5 w-full max-w-xs">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-400/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-400/50" />
          </div>

          {/* Subtitle */}
          <h2 className="text-lg font-semibold text-white/75 tracking-[0.06em] leading-snug max-w-xs">
            {t('app.subtitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-2 tracking-[0.15em] font-medium uppercase">
            {t('app.district')}
          </p>

          {/* Feature cards */}
          <div className="mt-12 w-full max-w-sm space-y-3 text-left">
            {features.map(({ text, accent }) => (
              <div
                key={text}
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.12]"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${accent} transition-transform duration-300 group-hover:scale-110`}>
                  <BadgeCheck size={15} />
                </div>
                <span className="text-[13px] text-white/65 leading-relaxed font-medium group-hover:text-white/80 transition-colors duration-300">
                  {text}
                </span>
                <ChevronRight size={14} className="ml-auto text-white/20 shrink-0 group-hover:text-white/40 transition-colors" />
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-12 w-full max-w-sm grid grid-cols-3 gap-3">
            {[
              { val: '6+',    label: 'Roles' },
              { val: '24/7',  label: 'Uptime' },
              { val: '100%',  label: 'Secure' },
            ].map(({ val, label }) => (
              <div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] py-3 px-2 text-center backdrop-blur-sm">
                <div className="text-xl font-black text-white tracking-tight">{val}</div>
                <div className="text-[10px] font-semibold text-slate-500 tracking-[0.12em] uppercase mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-center text-[10px] text-slate-600 tracking-[0.18em] font-semibold uppercase pb-6">
          Secure Connection · Authorized Personnel Only
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          RIGHT PANEL — clean light form
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-center min-h-screen bg-[#f0f3f8] px-6 py-14">
        <div className="w-full max-w-[430px]">

          {/* Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/70 shadow-2xl shadow-slate-300/40 overflow-hidden">

            {/* Top amber accent strip */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)' }} />

            <div className="px-10 pt-9 pb-10">

              {/* Header */}
              <div className="flex items-start justify-between mb-7">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-extrabold text-amber-600 tracking-[0.14em] uppercase mb-4">
                    <Fingerprint size={11} />
                    Secure Access
                  </span>
                  <h1
                    className="text-[1.75rem] font-black text-slate-900 leading-tight tracking-tight"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    Welcome<br />
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Back, Officer.
                    </span>
                  </h1>
                  <p className="mt-2 text-[12px] text-slate-400 font-medium tracking-wide leading-relaxed">
                    Enter your credentials to access the<br />Pharos Command Dashboard.
                  </p>
                </div>
                {/* Mini shield icon top-right */}
                <div className="mt-1 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                  <Shield size={22} className="text-slate-300" strokeWidth={1.5} />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs font-semibold text-red-600">{error}</span>
                </div>
              )}

              {/* ── Form ── */}
              <Form
                form={form}
                name="login"
                layout="vertical"
                onFinish={handleFinish}
                requiredMark={false}
              >
                {/* Badge No */}
                <Form.Item
                  name="badge_no"
                  label={
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      {t('common.badgeNo')}
                    </span>
                  }
                  rules={[{ required: true, message: 'Please enter your badge number' }]}
                  style={{ marginBottom: 14 }}
                >
                  <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                    <User size={15} className="text-slate-350 shrink-0 group-focus-within:text-blue-400 transition-colors" />
                    <Form.Item name="badge_no" noStyle rules={[{ required: true, message: 'Please enter your badge number' }]}>
                      <input
                        placeholder="e.g. HC001, SHO001"
                        className="w-full bg-transparent text-[13px] text-slate-800 font-semibold outline-none placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </Form.Item>
                  </div>
                </Form.Item>

                {/* Password */}
                <Form.Item
                  name="password"
                  label={
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                      Password
                    </span>
                  }
                  rules={[{ required: true, message: 'Please enter your password' }]}
                  style={{ marginBottom: 22 }}
                >
                  <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition-all duration-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
                    <Lock size={15} className="text-slate-350 shrink-0 group-focus-within:text-blue-400 transition-colors" />
                    <Form.Item name="password" noStyle rules={[{ required: true, message: 'Please enter your password' }]}>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-transparent text-[13px] text-slate-800 font-semibold outline-none placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </Form.Item>
                  </div>
                </Form.Item>

                {/* Submit */}
                <Form.Item style={{ marginBottom: 0 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    onClick={() => form.submit()}
                    className="w-full relative flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-[13px] font-extrabold text-white tracking-[0.06em] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #2563eb 100%)',
                      boxShadow: '0 6px 24px rgba(37,99,235,0.30), 0 1px 2px rgba(0,0,0,0.12)',
                    }}
                  >
                    {/* shine sweep */}
                    <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }}
                    />
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Authenticating…
                      </span>
                    ) : (
                      <>
                        <Shield size={14} className="text-blue-200" />
                        Log In to Dashboard
                        <ChevronRight size={14} className="text-blue-200 ml-auto" />
                      </>
                    )}
                  </button>
                </Form.Item>
              </Form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[9px] font-extrabold tracking-[0.18em] text-slate-300 uppercase">
                  Dev Quick Access
                </span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Quick login grid */}
              <div className="grid grid-cols-3 gap-2">
                {quickLogins.map(({ label, badge, color, ring }) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => handleQuickLogin(badge)}
                    className={`rounded-xl border border-slate-150 bg-slate-50 px-2 py-2.5 text-[11px] font-bold tracking-wide transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${color} ${ring}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Footer */}
              <p className="mt-7 text-center text-[10px] text-slate-300 tracking-[0.12em] font-semibold uppercase">
                Secure Connection · Authorized Delhi Police Personnel
              </p>
            </div>
          </div>

          {/* Below-card note */}
          <p className="mt-5 text-center text-[11px] text-slate-400 font-medium tracking-wide">
            Having trouble? Contact{' '}
            <span className="text-blue-500 font-semibold">HQ Administration</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;