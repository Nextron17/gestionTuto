export type TipoRecurso = 'video' | 'guia' | 'documento' | 'enlace';

export interface EscuelaItem {
  _id: string;
  nombre: string;
  codigo: string;
}

export interface TemaCatalogo {
  _id: string;
  nombre: string;
  materia: string;
}

export interface Recurso {
  _id: string;
  titulo: string;
  escuela: string;
  materia: string;
  tema?: string;
  tipo?: TipoRecurso;
  claseOrigen?: string;
  link: string;
  profesor?: {
    _id?: string;
    nombre: string;
  };
}

export const TIPOS_RECURSO: {
  id: TipoRecurso;
  label: string;
  icon: string;
  badgeVariant: 'primary' | 'secondary' | 'neutral' | 'success';
}[] = [
  { id: 'video', label: 'Video', icon: 'play_circle', badgeVariant: 'primary' },
  { id: 'guia', label: 'Guía', icon: 'menu_book', badgeVariant: 'success' },
  { id: 'documento', label: 'Documento', icon: 'description', badgeVariant: 'secondary' },
  { id: 'enlace', label: 'Enlace', icon: 'link', badgeVariant: 'neutral' },
];

export function getTipoMeta(tipo?: string) {
  return (
    TIPOS_RECURSO.find((t) => t.id === tipo) || {
      id: 'enlace' as TipoRecurso,
      label: 'Enlace',
      icon: 'link',
      badgeVariant: 'neutral' as const,
    }
  );
}

