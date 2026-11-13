'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';
import { Icon } from '../../../../components/ui/Icon';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { SurfaceCard } from '../../../../components/ui/SurfaceCard';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { CalloutBanner } from '../../../../components/ui/CalloutBanner';
import { Modal } from '../../../../components/ui/Modal';

interface Solicitud {
  _id: string;
  materia: string;
  tema?: string;
  descripcion: string;
  hora?: string;
  modalidad?: string;
  tipo?: string;
  comentarioProfesor?: string;
  estado: string;
  profesor?: {
    nombre: string;
    email: string;
  };
}

function renderEstadoCita(estado: string) {
  if (estado === 'pendiente') {
    return (
      <Badge variant="warning" pulseDot>
        Pendiente de confirmación
      </Badge>
    );
  }
  if (estado === 'aceptada') {
    return (
      <Badge variant="success">
        <Icon className="text-[15px] text-[#16a34a]">check_circle</Icon>
        <span>Aceptada y Agendada</span>
      </Badge>
    );
  }
  if (estado === 'aplazada') {
    return (
      <Badge variant="primary">
        <Icon className="text-[15px] text-primary">event_repeat</Icon>
        <span>Aplazada por Docente</span>
      </Badge>
    );
  }
  if (estado === 'finalizada') {
    return (
      <Badge variant="secondary">
        <Icon className="text-[15px]">task_alt</Icon>
        <span>Finalizada</span>
      </Badge>
    );
  }
  return (
    <Badge variant="error">
      <Icon className="text-[15px] text-error">cancel</Icon>
      <span>Cancelada</span>
    </Badge>
  );
}

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [solicitudACancelar, setSolicitudACancelar] = useState<Solicitud | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarSolicitudesAPI = async () => {
    try {
      const res = await api.get('/tutorias');
      setSolicitudes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      await cargarSolicitudesAPI();
      setCargando(false);
    };
    cargarInicial();
  }, []);

  const confirmarCancelacion = async () => {
    if (!solicitudACancelar) return;
    setCancelando(true);
    try {
      await api.patch(`/tutorias/${solicitudACancelar._id}`, { estado: 'cancelada' });
      await cargarSolicitudesAPI();
      setSolicitudACancelar(null);
    } catch (err) {
      console.error(err);
    } finally {
      setCancelando(false);
    }
  };

  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const coincideEstado = filtroEstado === 'todos' || sol.estado === filtroEstado;
    const q = busqueda.toLowerCase();
    if (!q) return coincideEstado;
    const coincideTexto =
      sol.materia.toLowerCase().includes(q) ||
      (sol.tema && sol.tema.toLowerCase().includes(q)) ||
      (sol.profesor?.nombre && sol.profesor.nombre.toLowerCase().includes(q)) ||
      sol.estado.toLowerCase().includes(q);
    return coincideEstado && coincideTexto;
  });

  if (cargando) {
    return (
      <div className="max-w-6xl mx-auto py-8 text-sm text-on-surface-variant flex items-center gap-2">
        <Icon className="text-primary animate-pulse">hourglass_top</Icon>
        <span>Cargando mis solicitudes...</span>
      </div>
    );
  }

  const estadosFiltro = [
    { id: 'todos', label: 'Todas' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aceptada', label: 'Aceptadas' },
    { id: 'aplazada', label: 'Aplazadas' },
    { id: 'cancelada', label: 'Canceladas' },
  ];

  return (
    <div className="space-y-space-lg max-w-6xl mx-auto min-w-0">
      <PageHeader
        eyebrow="02. Seguimiento de Citas"
        title="Mis Solicitudes"
        description="Estado en tiempo real de tus peticiones de tutoría, reprogramaciones y observaciones docentes."
        actions={
          solicitudes.length > 0 ? (
            <div className="w-full sm:w-80">
              <SearchInput
                placeholder="Buscar por materia, docente o estado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onClear={() => setBusqueda('')}
              />
            </div>
          ) : undefined
        }
      />

      {solicitudes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {estadosFiltro.map((est) => {
            const activo = filtroEstado === est.id;
            return (
              <button
                key={est.id}
                type="button"
                onClick={() => setFiltroEstado(est.id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full font-label-md text-[12px] font-semibold transition-all cursor-pointer active:scale-95 ${
                  activo
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                {est.label}
              </button>
            );
          })}
        </div>
      )}

      {solicitudes.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">pending_actions</Icon>
          <p className="text-sm text-on-surface-variant">
            No has solicitado ninguna tutoría todavía.
          </p>
        </SurfaceCard>
      ) : solicitudesFiltradas.length === 0 ? (
        <SurfaceCard tone="lowest" className="p-8 sm:p-10 text-center space-y-2">
          <Icon className="text-outline text-[36px]">search_off</Icon>
          <p className="text-sm text-on-surface-variant">
            No hay solicitudes que coincidan con los filtros seleccionados.
          </p>
        </SurfaceCard>
      ) : (
        <div className="space-y-4 sm:space-y-space-md">
          {solicitudesFiltradas.map((sol) => (
            <SurfaceCard
              key={sol._id}
              as="article"
              tone="lowest"
              interactive
              className="p-4 sm:p-space-lg flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-label-md text-[15px] sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors break-words">
                      {sol.materia} {sol.tema ? `• ${sol.tema}` : ''}
                    </h2>
                    {sol.modalidad && (
                      <Badge variant="neutral" pill={false} className="capitalize">
                        <Icon className="text-[14px]">
                          {sol.modalidad === 'presencial' ? 'location_on' : 'videocam'}
                        </Icon>
                        <span>{sol.modalidad}</span>
                      </Badge>
                    )}
                  </div>

                  <p className="font-body-md text-on-surface-variant text-[13px] leading-relaxed break-words">
                    {sol.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-on-surface-variant pt-1">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Icon className="text-[16px] text-primary">person</Icon>
                      <span>Docente:</span>
                      <strong className="font-semibold text-on-surface break-words">
                        {sol.profesor?.nombre || 'Por asignar'}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Icon className="text-[16px] text-outline">schedule</Icon>
                      <span>Horario:</span>
                      <strong className="font-semibold text-on-surface break-words">
                        {sol.hora || 'No definido'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container shrink-0">
                  {renderEstadoCita(sol.estado)}

                  {(sol.estado === 'pendiente' || sol.estado === 'aplazada') && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setSolicitudACancelar(sol)}
                    >
                      <Icon className="text-[16px]">delete_forever</Icon>
                      <span>Cancelar Solicitud</span>
                    </Button>
                  )}
                </div>
              </div>

              {sol.comentarioProfesor && (
                <CalloutBanner
                  tone="info"
                  icon="comment"
                  title="Observación del Docente"
                >
                  {sol.comentarioProfesor}
                </CalloutBanner>
              )}
            </SurfaceCard>
          ))}
        </div>
      )}

      {/* Modal Canónico de Confirmación de Cancelación (Sección 06 de code.html) */}
      <Modal
        open={Boolean(solicitudACancelar)}
        onClose={() => setSolicitudACancelar(null)}
        title="Confirmar Cancelación de Tutoría"
        icon="warning"
        tone="danger"
        footer={
          <>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setSolicitudACancelar(null)}
            >
              Mantener Tutoría
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelando}
              onClick={confirmarCancelacion}
            >
              Sí, Cancelar Sesión
            </Button>
          </>
        }
      >
        <p className="font-body-md text-sm text-on-surface leading-relaxed">
          ¿Estás seguro de que deseas cancelar la solicitud de{' '}
          <strong>{solicitudACancelar?.materia}</strong> con{' '}
          <strong>{solicitudACancelar?.profesor?.nombre || 'el docente asignado'}</strong>
          {solicitudACancelar?.hora ? (
            <>
              {' '}
              programada para <strong>{solicitudACancelar.hora}</strong>
            </>
          ) : null}
          ?
        </p>
        <div className="p-space-sm rounded-lg bg-surface-container text-on-surface-variant font-label-md text-[12px] flex items-start gap-2">
          <Icon className="text-primary text-[16px] shrink-0 mt-0.5">help</Icon>
          <span>
            El cupo será liberado inmediatamente en el calendario general para otros estudiantes de
            la facultad.
          </span>
        </div>
      </Modal>
    </div>
  );
}
