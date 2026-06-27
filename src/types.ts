export interface SmtMember {
  nip: string;
  nama: string;
  salesToday: number;
  checklistIntime: boolean;
  isUnlocked: boolean; // salesToday >= 18,000,000
  lastUpdated?: string;
  isManualOverride?: boolean;
}

export interface AppStats {
  totalSmt: number;
  totalSales: number;
  unlockedCount: number;
  lockedCount: number;
  unlockedPercentage: number;
  averageSales: number;
}

export interface SyncHistory {
  timestamp: string;
  status: 'success' | 'error';
  message: string;
  recordCount: number;
}
