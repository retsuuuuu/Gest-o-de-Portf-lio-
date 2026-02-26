export type ProjectPhase = 'Backlog' | 'Briefing' | 'Desenvolvimento' | 'Escopo' | 'Homologação Cliente' | 'Concluído' | 'Protótipo' | 'Valoração';
export type ProjectStatus = 'Backlog' | 'Concluído' | 'Em andamento' | 'Pausado' | 'Impedimento';
export type ProjectFarol = 'No prazo' | 'Atrasado (Cliente)' | 'Atrasado (TradeUp)' | 'Concluído';

export interface TeamData {
  "P.O": string[];
  "UX": string[];
  "QA": string[];
  "TI": string[];
}

export interface Project {
  id: string;
  type: string;
  initiative: string;
  client: string;
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
  description?: string;
  po?: string;
  ux?: string;
  qa?: string;
  ti?: string;
}

export type Priority = 'Star' | 'Heart' | 'Like';
