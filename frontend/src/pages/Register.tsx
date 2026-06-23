import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) e.password = 'Must contain a letter and number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await authApi.register(form);
      if (res.success && res.data) {
        setAuth(res.data.user, res.data.token);
        toast.success(`Welcome to GigFlow, ${res.data.user.name}!`);
        navigate('/');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <img src="/assets/logo-mark.svg" alt="GigFlow" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>GigFlow</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Smart Leads Dashboard</p>
        </div>

        <div className="card p-6 shadow-xl">
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Create account</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Join GigFlow to manage your leads</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Your full name"
              leftIcon={<User className="w-4 h-4" />}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-9 pr-9 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min 6 chars, letter + number"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>Create Account</Button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
