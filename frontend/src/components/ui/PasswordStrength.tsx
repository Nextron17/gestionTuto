import { Icon } from './Icon';

export interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

const requirementLabels: [keyof PasswordRequirements, string][] = [
  ['length', 'Mínimo 8 caracteres'],
  ['uppercase', 'Al menos 1 mayúscula'],
  ['number', 'Al menos 1 número'],
  ['special', '1 símbolo especial'],
];

export function PasswordStrength({ password }: { password: string }) {
  const requirements = getPasswordRequirements(password);
  const score = Object.values(requirements).filter(Boolean).length;
  const level = !password ? 'Vacía' : score <= 2 ? 'Débil' : score === 3 ? 'Media' : 'Fuerte';

  return (
    <section className="strength-panel" aria-label="Requisitos de seguridad de la contraseña">
      <div className="strength-heading">
        <span>
          <Icon>security</Icon>
          Nivel de seguridad:
        </span>
        <strong className={`strength-${level.toLowerCase()}`}>{level}</strong>
      </div>
      <div className="strength-bars" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            className={
              bar <= Math.ceil((score / 4) * 3)
                ? `strength-fill strength-fill-${level.toLowerCase()}`
                : ''
            }
            key={bar}
          />
        ))}
      </div>
      <div className="requirements">
        {requirementLabels.map(([key, label]) => (
          <span className={requirements[key] ? 'requirement met' : 'requirement'} key={key}>
            <Icon filled={requirements[key]}>{requirements[key] ? 'check_circle' : 'cancel'}</Icon>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}

