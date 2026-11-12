const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INSTITUTIONAL_DOMAIN = '@uniautonoma.edu.co';
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return 'El correo es obligatorio.';
  if (email.length > 254) return 'El correo es demasiado largo.';
  if (!EMAIL_PATTERN.test(email)) return 'Ingresa un correo electrónico válido.';
  return undefined;
}

export function validateInstitutionalEmail(value: string): string | undefined {
  const baseError = validateEmail(value);
  if (baseError) return baseError;
  if (!value.trim().toLowerCase().endsWith(INSTITUTIONAL_DOMAIN)) {
    return `El correo debe ser institucional (${INSTITUTIONAL_DOMAIN}).`;
  }
  return undefined;
}

export function validateName(value: string): string | undefined {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return 'El nombre completo es obligatorio.';
  if (name.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
  if (name.length > 80) return 'El nombre no puede superar 80 caracteres.';
  if (!NAME_PATTERN.test(name)) return 'El nombre solo puede contener letras y espacios.';
  if (name.split(' ').length < 2) return 'Ingresa nombre y apellido.';
  return undefined;
}

export function validateStrongPassword(value: string): string | undefined {
  if (!value) return 'La contraseña es obligatoria.';
  if (value.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
  if (value.length > 64) return 'La contraseña no puede superar 64 caracteres.';
  if (/\s/.test(value)) return 'La contraseña no puede contener espacios.';
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return 'Usa al menos una mayúscula, un número y un símbolo.';
  }
  return undefined;
}

export interface LoginErrors {
  email?: string;
  password?: string;
}

export function validateLogin(email: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  // En login solo se exige que exista: no se bloquean cuentas previas con otras reglas.
  if (!password) errors.password = 'La contraseña es obligatoria.';
  return errors;
}

export interface RegistrationValues {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  carrera: string;
  semestre: string;
  acceptTerms: boolean;
}

export interface RegistrationErrors {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  carrera?: string;
  semestre?: string;
  acceptTerms?: string;
}

export function validateRegistration(v: RegistrationValues): RegistrationErrors {
  const errors: RegistrationErrors = {};

  const nameError = validateName(v.nombre);
  if (nameError) errors.nombre = nameError;

  const emailError = validateInstitutionalEmail(v.email);
  if (emailError) errors.email = emailError;

  const passError = validateStrongPassword(v.password);
  if (passError) errors.password = passError;

  if (!v.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.';
  } else if (v.password !== v.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  if (!v.carrera) errors.carrera = 'Selecciona una carrera profesional.';

  const sem = Number(v.semestre);
  if (!v.semestre || !Number.isInteger(sem) || sem < 1 || sem > 12) {
    errors.semestre = 'Selecciona un semestre entre 1 y 12.';
  }

  if (!v.acceptTerms) errors.acceptTerms = 'Debes aceptar los términos.';

  return errors;
}

