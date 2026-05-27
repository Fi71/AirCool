import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

const sliderImages = [
  '/images/AC-AirFlow03.jpeg',
  '/images/AC-AirFlow04.jpeg',
];

function generateSnowflakes() {
  return Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${((i * 137.5) % 100)}%`,
    delay: `${(i * 0.7) % 20}s`,
    duration: `${12 + ((i * 1.3) % 18)}s`,
    size: `${0.4 + ((i * 0.9) % 1.2)}rem`,
    opacity: 0.15 + ((i * 0.8) % 2.5) * 0.1,
  }));
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snowflakes] = useState(generateSnowflakes);
  const [currentImage, setCurrentImage] = useState(0);
  const { login, appSettings } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 flex flex-col lg:flex-row">
      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-teal-500/10 animate-gradient"
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Radial glow orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-400/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[128px]" />

      {/* Floating snowflakes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {snowflakes.map((s) => (
          <div
            key={s.id}
            className="absolute top-0 animate-snowflake select-none"
            style={{
              left: s.left,
              animationDelay: s.delay,
              animationDuration: s.duration,
              fontSize: s.size,
              opacity: s.opacity,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Left Panel - Image Slider (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen overflow-hidden">
        {/* Sliding images */}
        <div className="absolute inset-0">
          {sliderImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt="Air Conditioner"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                i === currentImage ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
            />
          ))}
        </div>

        {/* Gradient overlay on image */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-slate-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        {/* Branding on image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
                <span className="text-2xl drop-shadow-lg">❄️</span>
              </div>
              <div>
                <p className="text-white/60 text-xs tracking-wider uppercase">AirCool</p>
                <p className="text-white font-bold text-lg">{appSettings.company.name}</p>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mt-8 leading-tight">
              Solusi Terpercaya<br />
              <span className="text-cyan-300">Untuk AC Anda</span>
            </h1>
            <p className="text-white/50 text-sm mt-3 max-w-md leading-relaxed">
              {appSettings.company.name} — sistem operasional AC yang modern, efisien, dan terintegrasi.
            </p>
          </div>

          <div className="space-y-4">
            {/* Slide indicators */}
            <div className="flex items-center gap-2">
              {sliderImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === currentImage
                      ? 'w-8 h-2 bg-cyan-400'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
            <p className="text-white/30 text-xs">&copy; 2026 {appSettings.company.name}</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen p-4 lg:p-8">
        <div className="relative w-full max-w-md animate-float">
          {/* Card glow */}
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-teal-500/30 rounded-3xl blur-2xl" />

          <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-cyan-600/90 via-blue-600/90 to-teal-700/90 p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                    <span className="text-3xl drop-shadow-lg">❄️</span>
                  </div>
                  <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-md -z-10" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{appSettings.company.name}</h1>
                  <p className="text-white/60 text-sm tracking-wider uppercase">Sistem Operasional AC</p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="p-8">
              <h2 className="text-xl font-semibold text-white mb-1">Selamat Datang</h2>
              <p className="text-white/50 text-sm mb-8">Masuk ke akun Anda untuk melanjutkan</p>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <p className="text-red-300 text-sm flex items-center gap-2">
                    <span>⚠️</span>
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl placeholder-white/30 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 outline-none"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl placeholder-white/30 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 outline-none"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memuat...
                      </>
                    ) : 'Masuk'}
                  </span>
                </button>
              </form>

              {/* Demo credentials */}
              <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-white/50 font-medium mb-2 tracking-wider uppercase">Kredensial Demo</p>
                <div className="space-y-1.5 text-xs text-white/40">
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400/50 rounded-full shrink-0" />
                    Admin: <span className="text-white/60">admin / admin123</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-400/50 rounded-full shrink-0" />
                    Teknisi: <span className="text-white/60">ahmad / technician123</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-teal-400/50 rounded-full shrink-0" />
                    Teknisi: <span className="text-white/60">budi / technician123</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-400/50 rounded-full shrink-0" />
                    Manajemen: <span className="text-white/60">manajemen / manajemen123</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pb-6 text-center lg:hidden">
              <p className="text-xs text-white/20">&copy; 2026 {appSettings.company.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
