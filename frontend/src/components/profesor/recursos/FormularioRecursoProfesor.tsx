import { SurfaceCard } from '../../ui/SurfaceCard';
import { Icon } from '../../ui/Icon';
import { Button } from '../../ui/Button';
import { CalloutBanner } from '../../ui/CalloutBanner';
import { FormInput, FormSelect } from '../../ui/FormField';
import { EscuelaItem, TemaCatalogo, TipoRecurso, getTipoMeta } from './types';

interface FormularioRecursoProfesorProps {
  feedback: { tipo: 'ok' | 'error'; texto: string } | null;
  agregarRecurso: (e: React.FormEvent) => void;
  escuelaForm: string;
  setEscuelaForm: (value: string) => void;
  escuelas: EscuelaItem[];
  materiaSelect: string;
  cambiarMateriaForm: (value: string) => void;
  materiasCatalogo: string[];
  otraMateria: string;
  setOtraMateria: (value: string) => void;
  temaSelect: string;
  setTemaSelect: (value: string) => void;
  temasDeMateriaForm: TemaCatalogo[];
  otroTema: string;
  setOtroTema: (value: string) => void;
  titulo: string;
  setTitulo: (value: string) => void;
  tipo: TipoRecurso;
  setTipo: (value: TipoRecurso) => void;
  link: string;
  setLink: (value: string) => void;
  publicando: boolean;
}

export function FormularioRecursoProfesor({
  feedback,
  agregarRecurso,
  escuelaForm,
  setEscuelaForm,
  escuelas,
  materiaSelect,
  cambiarMateriaForm,
  materiasCatalogo,
  otraMateria,
  setOtraMateria,
  temaSelect,
  setTemaSelect,
  temasDeMateriaForm,
  otroTema,
  setOtroTema,
  titulo,
  setTitulo,
  tipo,
  setTipo,
  link,
  setLink,
  publicando,
}: FormularioRecursoProfesorProps) {
  return (
    <SurfaceCard tone="lowest" className="p-4 sm:p-space-lg space-y-space-md h-fit">
      <div>
        <h2 className="font-label-md text-base font-bold text-on-surface flex items-center gap-2">
          <Icon className="text-primary text-[20px]">upload_file</Icon>
          <span>Recomendar Nuevo Recurso</span>
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Asocia cada recurso a una materia y tema con su título, tipo y URL.
        </p>
      </div>

      {feedback && (
        <CalloutBanner
          tone={feedback.tipo === 'ok' ? 'success' : 'danger'}
          title={feedback.tipo === 'ok' ? 'Recurso publicado' : 'No se pudo publicar'}
        >
          {feedback.texto}
        </CalloutBanner>
      )}

      <form onSubmit={agregarRecurso} className="space-y-3.5">
        <FormSelect
          id="recurso-escuela"
          label="Escuela *"
          icon="domain"
          value={escuelaForm}
          onChange={(e) => setEscuelaForm(e.target.value)}
          required
        >
          <option value="">-- Seleccionar Escuela --</option>
          {escuelas.map((esc) => (
            <option key={esc._id} value={esc.nombre}>
              {esc.nombre}
            </option>
          ))}
        </FormSelect>

        <FormSelect
          id="recurso-materia"
          label="Materia / Asignatura *"
          icon="menu_book"
          value={materiaSelect}
          onChange={(e) => cambiarMateriaForm(e.target.value)}
          required
        >
          {materiasCatalogo.map((mat) => (
            <option key={mat} value={mat}>
              {mat}
            </option>
          ))}
          <option value="__otra__">+ Otra materia (escribir manualmente)</option>
        </FormSelect>

        {materiaSelect === '__otra__' && (
          <FormInput
            id="recurso-otra-materia"
            label="Nombre de la Materia *"
            icon="edit_note"
            placeholder="Ej: Cálculo Multivariable"
            value={otraMateria}
            onChange={(e) => setOtraMateria(e.target.value)}
            required
          />
        )}

        <FormSelect
          id="recurso-tema"
          label="Tema Asociado *"
          icon="topic"
          value={temaSelect}
          onChange={(e) => setTemaSelect(e.target.value)}
          required
        >
          {temasDeMateriaForm.map((tm) => (
            <option key={tm._id} value={tm.nombre}>
              {tm.nombre}
            </option>
          ))}
          <option value="__otro__">+ Escribir tema específico</option>
        </FormSelect>

        {temaSelect === '__otro__' && (
          <FormInput
            id="recurso-otro-tema"
            label="Nombre del Tema *"
            icon="topic"
            placeholder="Ej: Árboles AVL y Rotaciones"
            value={otroTema}
            onChange={(e) => setOtroTema(e.target.value)}
            required
          />
        )}

        <FormInput
          id="recurso-titulo"
          label="Título del Recurso *"
          icon="description"
          placeholder="Ej: Guía de Ejercicios Resueltos"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />

        <FormSelect
          id="recurso-tipo"
          label="Tipo de Recurso *"
          icon={getTipoMeta(tipo).icon}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoRecurso)}
          required
        >
          <option value="video">Video (clase / tutorial)</option>
          <option value="guia">Guía de estudio / taller</option>
          <option value="documento">Documento / PDF / libro</option>
          <option value="enlace">Enlace / herramienta interactiva</option>
        </FormSelect>

        <FormInput
          id="recurso-link"
          type="url"
          label="URL del Recurso *"
          icon="link"
          placeholder="https://..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          required
        />

        <Button type="submit" variant="primary" fullWidth loading={publicando}>
          <Icon className="text-[18px]">add</Icon>
          <span>Publicar Recurso Recomendado</span>
        </Button>
      </form>
    </SurfaceCard>
  );
}

