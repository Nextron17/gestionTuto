'use client';

import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { AxiosError } from 'axios';
import { InstitutionPanel } from '../../../components/layout/InstitutionPanel';
import { Icon } from '../../../components/ui/Icon';
import { StatusAlert } from '../../../components/ui/StatusAlert';
import { validateLogin } from '../../../lib/validation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { login } = useAuth();
  const router = useRouter();

  const validateField = (field: 'email' | 'password') => {
    const errors = validateLogin(email, password);
    setFieldErrors((curr) => ({ ...curr, [field]: errors[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    const nextFieldErrors = validateLogin(email, password);

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      login(res.data.token, res.data.usuario);

      if (res.data.usuario.rol === 'admin') {
        router.push('/admin/usuarios');
      } else if (res.data.usuario.rol === 'profesor') {
        router.push('/profesor/solicitudes');
      } else {
        router.push('/estudiante/buscar-tutorias');
      }
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setError(errorAxios.response?.data?.message || 'Error en el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <div className="login-card">
          <InstitutionPanel />

          <section className="auth-panel" aria-labelledby="login-title">
            <div className="auth-content">
              <header className="auth-header">
                <span className="eyebrow">Acceso Seguro</span>
                <h2 id="login-title">Iniciar Sesión</h2>
                <p>Ingresa tus credenciales institucionales</p>
              </header>

              {error && (
                <StatusAlert
                  tone="error"
                  title="No se pudo iniciar sesión"
                  message={error}
                />
              )}

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                <div className={`field-group ${fieldErrors.email ? 'has-error' : ''}`}>
                  <label htmlFor="email-input">
                    <span>Correo institucional</span>
                    {fieldErrors.email && (
                      <span className="field-error">
                        <Icon>cancel</Icon> {fieldErrors.email}
                      </span>
                    )}
                  </label>
                  <div className="input-wrapper">
                    <Icon>alternate_email</Icon>
                    <input
                      id="email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                        if (fieldErrors.email) {
                          setFieldErrors((curr) => ({ ...curr, email: undefined }));
                        }
                      }}
                      onBlur={() => validateField('email')}
                      placeholder="usuario@uniautonoma.edu.co"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'email-error' : 'email-help'}
                      required
                    />
                  </div>
                  {fieldErrors.email ? (
                    <span className="field-help field-error-message" id="email-error">
                      {fieldErrors.email}
                    </span>
                  ) : (
                    <span className="field-help" id="email-help">
                      Utiliza tu identificador oficial @uniautonoma.edu.co
                    </span>
                  )}
                </div>

                <div className={`field-group password-group ${fieldErrors.password ? 'has-error' : ''}`}>
                  <div className="password-label">
                    <label htmlFor="password-input">Contraseña</label>
                    <button
                      className="visibility-toggle"
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-pressed={showPassword}
                    >
                      <Icon>{showPassword ? 'visibility_off' : 'visibility'}</Icon>
                      {showPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <Icon>lock</Icon>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                        if (fieldErrors.password) {
                          setFieldErrors((curr) => ({ ...curr, password: undefined }));
                        }
                      }}
                      onBlur={() => validateField('password')}
                      placeholder="••••••••••••"
                      aria-invalid={Boolean(fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                      required
                    />
                  </div>
                  {fieldErrors.password && (
                    <span className="field-help field-error-message" id="password-error">
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className="form-options">
                  <label className="remember-option">
                    <input
                      type="checkbox"
                      checked={rememberSession}
                      onChange={(e) => setRememberSession(e.target.checked)}
                    />
                    <span>Recordar sesión</span>
                  </label>
                  <a href="#forgot-password">¿Olvidaste tu contraseña?</a>
                </div>

                <button className="submit-button" type="submit" disabled={isSubmitting}>
                  <span>{isSubmitting ? 'Ingresando...' : 'Ingresar'}</span>
                  <Icon>arrow_forward</Icon>
                </button>
              </form>

              <div className="register-prompt">
                <span>¿No tienes una cuenta aún?</span>
                <Link href="/registro">Crear cuenta</Link>
              </div>

              <nav className="secondary-links" aria-label="Enlaces institucionales">
                <a href="#help">Mesa de Ayuda</a>
                <span aria-hidden="true">•</span>
                <a href="#terms">Términos del Servicio</a>
                <span aria-hidden="true">•</span>
                <a href="#privacy">Políticas de Privacidad</a>
              </nav>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
