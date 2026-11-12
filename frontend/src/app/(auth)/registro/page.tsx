'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { AxiosError } from 'axios';
import { Icon } from '../../../components/ui/Icon';
import { StatusAlert } from '../../../components/ui/StatusAlert';
import { PasswordStrength, getPasswordRequirements } from '../../../components/ui/PasswordStrength';
import { validateRegistration, RegistrationErrors } from '../../../lib/validation';

interface CarreraItem {
  id: string;
  nombre: string;
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, children, help }: FieldProps) {
  return (
    <div className={`registration-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        <span aria-hidden="true"> *</span>
      </label>
      {children}
      {error ? (
        <span className="registration-error" id={`${id}-error`}>
          {error}
        </span>
      ) : (
        help && <span className="registration-help">{help}</span>
      )}
    </div>
  );
}

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('1');
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [carreras, setCarreras] = useState<CarreraItem[]>([]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const cargarCarreras = async () => {
      try {
        const res = await api.get('/auth/carreras');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCarreras(res.data);
          setCarrera(res.data[0].nombre);
        }
      } catch (err) {
        console.error('Error cargando carreras de la API:', err);
        const fallback = [
          { id: '1', nombre: 'Ingeniería de Software y computación' },
          { id: '2', nombre: 'Derecho' },
          { id: '3', nombre: 'Administración de Empresas' },
          { id: '4', nombre: 'Ingeniería Civil' },
          { id: '5', nombre: 'Contaduría Pública' },
        ];
        setCarreras(fallback);
        setCarrera(fallback[0].nombre);
      }
    };
    cargarCarreras();
  }, []);

  const validateField = (field: keyof RegistrationErrors) => {
    const errors = validateRegistration({
      nombre,
      email,
      password,
      confirmPassword,
      carrera,
      semestre,
      acceptTerms,
    });
    setFieldErrors((curr) => ({ ...curr, [field]: errors[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    const nextErrors = validateRegistration({
      nombre,
      email,
      password,
      confirmPassword,
      carrera,
      semestre,
      acceptTerms,
    });

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/registro', {
        nombre: nombre.trim().replace(/\s+/g, ' '),
        email: email.trim(),
        password,
        carrera,
        semestre: Number(semestre),
      });

      const loginRes = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });
      login(loginRes.data.token, loginRes.data.usuario);

      if (loginRes.data.usuario.rol === 'admin') {
        router.push('/admin/usuarios');
      } else if (loginRes.data.usuario.rol === 'profesor') {
        router.push('/profesor/solicitudes');
      } else {
        router.push('/estudiante/buscar-tutorias');
      }
    } catch (err) {
      const errorAxios = err as AxiosError<{ message: string }>;
      setError(errorAxios.response?.data?.message || 'Error al registrar estudiante');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requirements = getPasswordRequirements(password);

  return (
    <main className="registration-page">
      <div className="registration-shell">
        <header className="registration-header">
          <div className="registration-brand">
            <span>
              <Icon>school</Icon>
            </span>
            <div>
              <strong>Portal Académico Institucional</strong>
              <small>Admisión y Gestión Curricular Digital</small>
            </div>
          </div>
          <div className="secure-label">
            <Icon>verified_user</Icon> Entorno Seguro SSL 256-bit
          </div>
        </header>

        <section className="registration-card">
          <div className="registration-card-content">
            <div className="registration-title">
              <div>
                <div className="title-line">
                  <h1>Registro de Estudiante</h1>
                  <span className="role-badge">
                    <Icon filled>badge</Icon> Rol: Estudiante (Asignación Automática)
                  </span>
                </div>
                <p>
                  Completa tus credenciales oficiales para vincular tu matrícula y expedir tu carnet
                  digital.
                </p>
              </div>
            </div>

            <form className="registration-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <StatusAlert
                  tone="error"
                  title="No se pudo crear la cuenta"
                  message={error}
                />
              )}

              <div className="registration-grid">
                <Field
                  id="fullName"
                  label="Nombre completo"
                  error={fieldErrors.nombre}
                  help="Conforme a tu documento oficial de identidad"
                >
                  <div className="registration-input">
                    <Icon>person</Icon>
                    <input
                      id="fullName"
                      type="text"
                      value={nombre}
                      onChange={(e) => {
                        setNombre(e.target.value);
                        setError('');
                        if (fieldErrors.nombre) {
                          setFieldErrors((c) => ({ ...c, nombre: undefined }));
                        }
                      }}
                      onBlur={() => validateField('nombre')}
                      placeholder="Ingresa tu nombre completo"
                      aria-invalid={Boolean(fieldErrors.nombre)}
                      required
                    />
                  </div>
                </Field>

                <Field
                  id="instEmail"
                  label="Correo institucional"
                  error={fieldErrors.email}
                  help="Usa tu correo oficial @uniautonoma.edu.co"
                >
                  <div className="registration-input">
                    <Icon>mail</Icon>
                    <input
                      id="instEmail"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                        if (fieldErrors.email) {
                          setFieldErrors((c) => ({ ...c, email: undefined }));
                        }
                      }}
                      onBlur={() => validateField('email')}
                      placeholder="usuario@uniautonoma.edu.co"
                      aria-invalid={Boolean(fieldErrors.email)}
                      required
                    />
                  </div>
                </Field>

                <Field id="pwdInput" label="Contraseña" error={fieldErrors.password}>
                  <div className="registration-input">
                    <Icon>lock</Icon>
                    <input
                      id="pwdInput"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                        if (fieldErrors.password) {
                          setFieldErrors((c) => ({ ...c, password: undefined }));
                        }
                      }}
                      onBlur={() => validateField('password')}
                      placeholder="Crea una contraseña"
                      aria-invalid={Boolean(fieldErrors.password)}
                      required
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      <Icon>{showPassword ? 'visibility_off' : 'visibility'}</Icon>
                    </button>
                  </div>
                </Field>

                <Field
                  id="confirmPwdInput"
                  label="Confirmar contraseña"
                  error={fieldErrors.confirmPassword}
                >
                  <div className="registration-input">
                    <Icon>lock_reset</Icon>
                    <input
                      id="confirmPwdInput"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors((c) => ({ ...c, confirmPassword: undefined }));
                        }
                      }}
                      onBlur={() => validateField('confirmPassword')}
                      placeholder="Repite la contraseña"
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    />
                    <button
                      type="button"
                      aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                      onClick={() => setShowConfirm((visible) => !visible)}
                    >
                      <Icon>{showConfirm ? 'visibility_off' : 'visibility'}</Icon>
                    </button>
                  </div>
                </Field>

                <div className="registration-wide">
                  <PasswordStrength password={password} />
                </div>

                <Field
                  id="careerSelect"
                  label="Carrera profesional"
                  error={fieldErrors.carrera}
                  help="Programa acreditado en el que cursarás asignaturas"
                >
                  <div className="registration-input">
                    <Icon>local_library</Icon>
                    <select
                      id="careerSelect"
                      value={carrera}
                      onChange={(e) => {
                        setCarrera(e.target.value);
                        setError('');
                        if (fieldErrors.carrera) {
                          setFieldErrors((c) => ({ ...c, carrera: undefined }));
                        }
                      }}
                      aria-invalid={Boolean(fieldErrors.carrera)}
                      required
                    >
                      <option value="">-- Seleccionar Carrera --</option>
                      {carreras.map((car) => (
                        <option key={car.id} value={car.nombre}>
                          {car.nombre}
                        </option>
                      ))}
                    </select>
                    <Icon>expand_more</Icon>
                  </div>
                </Field>

                <Field
                  id="semesterSelect"
                  label="Semestre académico"
                  error={fieldErrors.semestre}
                  help="Nivel de inicio para pre-asignación de turnos y materias"
                >
                  <div className="registration-input">
                    <Icon>calendar_month</Icon>
                    <select
                      id="semesterSelect"
                      value={semestre}
                      onChange={(e) => {
                        setSemestre(e.target.value);
                        setError('');
                        if (fieldErrors.semestre) {
                          setFieldErrors((c) => ({ ...c, semestre: undefined }));
                        }
                      }}
                      aria-invalid={Boolean(fieldErrors.semestre)}
                      required
                    >
                      {Array.from({ length: 12 }, (_, index) => (
                        <option value={String(index + 1)} key={index + 1}>
                          {index + 1}° Semestre
                        </option>
                      ))}
                    </select>
                    <Icon>expand_more</Icon>
                  </div>
                </Field>
              </div>

              <div className="student-info">
                <span>
                  <Icon>info</Icon>
                </span>
                <p>
                  Tu cuenta será configurada automáticamente con perfil de{' '}
                  <strong>Estudiante activo</strong>. Tendrás acceso inmediato al campus virtual,
                  biblioteca y horario de clases.
                </p>
              </div>

              <div className={`terms-row ${fieldErrors.acceptTerms ? 'has-error' : ''}`}>
                <input
                  id="termsCheckbox"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (fieldErrors.acceptTerms) {
                      setFieldErrors((c) => ({ ...c, acceptTerms: undefined }));
                    }
                  }}
                />
                <label htmlFor="termsCheckbox">
                  Acepto los <a href="#terms">Términos y Condiciones</a> institucionales y autorizo
                  expresamente el <a href="#privacy">Tratamiento de Datos Personales</a> para fines
                  académicos y administrativos de la Universidad.
                </label>
              </div>
              {fieldErrors.acceptTerms && (
                <span className="registration-error">{fieldErrors.acceptTerms}</span>
              )}

              <div className="registration-actions">
                <button className="create-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta de estudiante'}{' '}
                  <Icon>arrow_forward</Icon>
                </button>
                <span>
                  ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>
                </span>
              </div>

              <div className="registration-footer">
                <span>
                  <Icon>help</Icon> ¿Dudas con la matrícula? Contacta a{' '}
                  <a href="mailto:soporte.academico@uniautonoma.edu.co">
                    soporte.academico@uniautonoma.edu.co
                  </a>
                </span>
                <span>Código de formulario: REG-EST-HU11</span>
              </div>

              <span className="sr-only">
                {Object.values(requirements).filter(Boolean).length} de 4 requisitos de contraseña
                cumplidos
              </span>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
