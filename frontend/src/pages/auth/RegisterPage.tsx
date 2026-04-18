import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Tractor, Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  username: z.string().min(3, 'Mindestens 3 Zeichen').max(50),
  email: z.string().email('Ungültige E-Mail'),
  full_name: z.string().optional(),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm_password'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { confirm_password, ...payload } = data;
      const res = await authApi.register(payload);
      setAuth(res.data.user, res.data.access_token);
      toast.success('Willkommen bei LSManagement!');
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Registrierung fehlgeschlagen');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center px-4 py-12">
      <Helmet>
        <title>Kostenlos registrieren – LSManagement für LS22 &amp; LS25</title>
        <meta name="description" content="Erstelle deinen kostenlosen LSManagement-Account und verwalte deinen Farming Simulator 22 & 25 Hof professionell." />
        <link rel="canonical" href="https://lscomm.braetter-int.de/register" />
      </Helmet>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <Tractor className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-white mb-2">Hof anlegen</h1>
          <p className="text-white/70">Erstelle deinen kostenlosen Account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="on">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Benutzername *</label>
                <input {...register('username')} autoComplete="username" className="input" placeholder="farmkönig_24" />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
              </div>
              <div>
                <label className="label">Vollständiger Name</label>
                <input {...register('full_name')} autoComplete="name" className="input" placeholder="Max Mustermann" />
              </div>
            </div>
            <div>
              <label className="label">E-Mail *</label>
              <input {...register('email')} type="email" autoComplete="email" className="input" placeholder="max@beispiel.de" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Passwort *</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pr-10"
                  placeholder="Mindestens 6 Zeichen"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Passwort bestätigen *</label>
              <input {...register('confirm_password')} type="password" autoComplete="new-password" className="input" placeholder="••••••••" />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 text-base mt-2">
              {isSubmitting ? 'Registrieren...' : 'Account erstellen'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-6">
            Bereits ein Konto?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
