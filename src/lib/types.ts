export type ModelOption = {
  id: string;
  label: string;
  provider: string;
  default?: boolean;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  channel: string;
  modelId: string;
  status: 'online' | 'idle' | 'building' | 'offline';
  uptime: string;
  tasks: string[];
  priority: 'low' | 'medium' | 'high';
};

export type KanbanCard = {
  id: string;
  title: string;
  assignee: string;
  status: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type ApiProviderUsage = {
  id: string;
  name: string;
  requests: number;
  tokens: number;
  cost: number;
  quota: number;
  sparkline: number[];
};

export type BrandCard = {
  name: string;
  slug: string;
  dropboxPath: string;
  dropboxLink: string | null;
  owner: string;
  status: 'ready' | 'link-missing';
};

export type PaletteSwatch = {
  name: string;
  hex: string;
};

export type PaletteEntry = {
  brand: string;
  updatedAt: string;
  source: string;
  swatches: PaletteSwatch[];
};

export type DependencyItem = {
  id: string;
  title: string;
  owner: string;
  status: 'waiting' | 'in-progress' | 'done';
};

export type ActivityItem = {
  timestamp: string;
  summary: string;
  actor: string;
};
