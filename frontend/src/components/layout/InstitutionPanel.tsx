import { Icon } from '../ui/Icon';

const benefits = [
  {
    icon: 'auto_stories',
    title: 'Gestión de Asignaturas',
    description:
      'Consulta horarios, material de clase y registra matrículas activas.',
  },
  {
    icon: 'assignment_turned_in',
    title: 'Trámites en Línea',
    description: 'Expedición de certificados, solicitudes y pagos sin filas.',
  },
  {
    icon: 'insights',
    title: 'Seguimiento Curricular',
    description:
      'Supervisa tu historial de calificaciones, créditos y progreso de graduación.',
  },
];

export function InstitutionPanel() {
  return (
    <section className="institution-panel" aria-labelledby="welcome-title">
      <div className="panel-decoration panel-decoration-top" />
      <div className="panel-decoration panel-decoration-bottom" />

      <div className="institution-content">
        <div className="brand">
          <div className="brand-icon">
            <Icon filled>account_balance</Icon>
          </div>
          <div className="brand-copy">
            <span className="eyebrow">Campus Digital</span>
            <span className="brand-name">Universidad Central</span>
          </div>
        </div>

        <div className="welcome-copy">
          <h1 id="welcome-title">Bienvenido a tu Portal Académico</h1>
          <p>
            Accede a una experiencia educativa integrada con herramientas
            diseñadas para impulsar tu trayectoria profesional.
          </p>
        </div>

        <div className="benefit-list">
          {benefits.map((benefit) => (
            <div className="benefit" key={benefit.title}>
              <div className="benefit-icon">
                <Icon>{benefit.icon}</Icon>
              </div>
              <div>
                <h2>{benefit.title}</h2>
                <p>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <figure className="institution-quote">
        <Icon>format_quote</Icon>
        <div>
          <blockquote>
            “La educación superior transforma vidas cuando el conocimiento y la
            tecnología convergen para abrir nuevas oportunidades.”
          </blockquote>
          <figcaption>— Dirección Académica &amp; Éxito Estudiantil</figcaption>
        </div>
      </figure>
    </section>
  );
}

