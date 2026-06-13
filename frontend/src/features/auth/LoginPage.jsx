import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { loginSchema } from '../../utils/validators.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ROUTES } from '../../utils/constants.js';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data) => loginMutation.mutate(data);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Card variant="glass" className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
              <BookOpen className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1">Sign in to your Crime Diaries account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="login-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-8 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              id="login-submit"
              type="submit"
              fullWidth
              size="lg"
              isLoading={loginMutation.isPending}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to={ROUTES.REGISTER} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
