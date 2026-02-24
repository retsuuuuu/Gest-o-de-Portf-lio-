export type ProjectPhase = 'Backlog' | 'Briefing' | 'Desenvolvimento' | 'Escopo' | 'Homologação Cliente' | 'Concluído' | 'Protótipo' | 'Valoração';
export type ProjectStatus = 'Backlog' | 'Concluído' | 'Em andamento' | 'Pausado' | 'Impedimento';
export type ProjectFarol = 'No prazo' | 'Atrasado (Cliente)' | 'Atrasado (TradeUp)' | 'Concluído';

export interface Project {
  id: string;
  type: string;
  initiative: string;
  code: string;
  name: string;
  phase: string;
  status: string;
  baseline: string; // Renamed to Data Base in UI
  deliveryDate?: string;
  replannedDate?: string;
  report: string;
  replanning?: string;
  farol: string;
}

export type Priority = 'Star' | 'Heart' | 'Like';
