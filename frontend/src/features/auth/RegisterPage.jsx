import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { registerSchema } from '../../utils/validators.js';
import { useAuth } from '../../hooks/useAuth.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { ROUTES } from '../../utils/constants.js';

export default function RegisterPage() {
  const { registerMutation } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = (data) => registerMutation.mutate(data);

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
            <h1 className="text-2xl font-bold text-zinc-100">Create your account</h1>
            <p className="text-zinc-500 text-sm mt-1">Join thousands of crime fiction readers</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="register-username"
              label="Username"
              type="text"
              placeholder="darkdetective"
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              id="register-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="register-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              helperText="Min 8 chars, one uppercase, one number"
              {...register('password')}
            />
            <Input
              id="register-confirm-password"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              id="register-submit"
              type="submit"
              fullWidth
              size="lg"
              isLoading={registerMutation.isPending}
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
