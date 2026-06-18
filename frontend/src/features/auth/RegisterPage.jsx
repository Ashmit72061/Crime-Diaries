import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerSchema } from '../../utils/validators.js';
import { useAuth } from '../../hooks/useAuth.js';
import delhiPoliceLogo from '../../assets/delhi_police_logo.png';
import { ROUTES } from '../../utils/constants.js';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { registerMutation } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="login-page-bg">
      <div className="login-card-container grid grid-cols-1 md:grid-cols-12">

        {/* Left Panel: Crest, Title, Info */}
        <div className="login-left-col md:col-span-5 flex flex-col justify-between items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="crest-frame-light">
              <img
                src={delhiPoliceLogo}
                alt="Delhi Police Crest"
                className="w-18 h-18 object-contain"
              />
            </div>
            <h1 className="login-main-title">PHAROS Registration</h1>
            <p className="login-main-subtitle">Request official access to the PRISM secure database console</p>
          </div>

          <div className="login-preview-box">
            <div className="login-preview-avatar">
              <Shield size={18} aria-hidden="true" />
            </div>
            <div className="login-preview-content">
              <span className="login-preview-title">ACCESS PRIVILEGES</span>
              <span className="login-preview-name">Authorized Personnel Only</span>
              <span className="login-preview-subtext">
                Requests are routed to division administrators for verification.
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Form Inputs, Submit */}
        <div className="login-right-col md:col-span-7 flex flex-col justify-between">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4.5 w-full">

            {/* Username Field */}
            <div className="light-form-group">
              <label htmlFor="register-username">Username *</label>
              <input
                id="register-username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                placeholder="e.g., darkdetective"
                className="light-input-field"
                {...register('username')}
              />
              {errors.username && <span className="text-xs text-red-500 mt-1">{errors.username.message}</span>}
            </div>

            {/* Email Field */}
            <div className="light-form-group">
              <label htmlFor="register-email">Official Email *</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@delhipolice.gov.in"
                className="light-input-field"
                {...register('email')}
              />
              {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email.message}</span>}
            </div>

            {/* Password Field */}
            <div className="light-form-group">
              <label htmlFor="register-password">Password *</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="light-input-field pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-500 mt-1">{errors.password.message}</span>}
            </div>

            {/* Confirm Password Field */}
            <div className="light-form-group">
              <label htmlFor="register-confirm-password">Confirm Password *</label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="light-input-field pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-pressed={showConfirmPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {errors.confirmPassword && <span className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</span>}
            </div>

            {/* Warning Box */}
            <div className="light-warning-box">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Warning:</strong> Unauthorized accounts or false claims of official affiliation are subject to audit, monitoring, and legal prosecution under Section 66 of IT Act, 2000.
              </span>
            </div>

            {/* Submit Button */}
            <button
              id="register-submit"
              type="submit"
              disabled={registerMutation.isPending}
              className="light-submit-btn"
            >
              {registerMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Shield size={16} aria-hidden="true" />
              )}
              <span>{registerMutation.isPending ? 'Submitting Request…' : 'Request Official Access'}</span>
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
