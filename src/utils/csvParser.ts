import { SmtMember, AppStats } from '../types';

/**
 * Returns the active target limit in Rupiah based on the current time.
 * Jam 10.00 - 14.00 (inclusive) -> 16,000,000 (16jt)
 * Selebihnya / Lewat dari jam 14.00 -> 20,000,000 (20jt)
 */
export function getTargetLimit(date: Date = new Date()): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeVal = hours * 100 + minutes;
  
  if (timeVal >= 1000 && timeVal <= 1400) {
    return 16000000; // 16jt
  }
  return 20000000; // 20jt
}

/**
 * Parses a standard CSV string from Google Sheets, handling quotes and commas cleanly.
 */
export function parseGoogleSheetsCsv(csvText: string): SmtMember[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped double quote inside a quoted field
        currentCell += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      if (char === '\r' && nextChar === '\n') {
        i++; // skip the LF character in CRLF
      }
    } else {
      currentCell += char;
    }
  }

  // Handle last line if it doesn't end with a newline
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  // Parse headers
  const headers = rows[0];
  const nipIndex = headers.findIndex(h => h.toUpperCase().includes('NIP'));
  const namaIndex = headers.findIndex(h => h.toUpperCase().includes('NAMA'));
  const salesIndex = headers.findIndex(h => h.toUpperCase().includes('SALES') || h.toUpperCase().includes('SALE'));
  const checklistIndex = headers.findIndex(h => h.toUpperCase().includes('CHEKLIST') || h.toUpperCase().includes('CHECKLIST') || h.toUpperCase().includes('INTIME'));

  const members: SmtMember[] = [];
  const currentTarget = getTargetLimit();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;

    // Extract NIP (fallback to index 0)
    const nip = (nipIndex !== -1 ? row[nipIndex] : row[0])?.trim() || '';
    if (!nip) continue;

    // Extract NAMA (fallback to index 1)
    const nama = (namaIndex !== -1 ? row[namaIndex] : row[1])?.trim() || '';
    
    // Extract SALES TODAY (fallback to index 2)
    const rawSales = (salesIndex !== -1 ? row[salesIndex] : row[2]) || '0';
    const salesToday = parseCurrencyToNumber(rawSales);

    // Extract Checklist Intime (fallback to index 3)
    const rawChecklist = (checklistIndex !== -1 ? row[checklistIndex] : row[3]) || 'FALSE';
    const checklistIntime = rawChecklist.toUpperCase() === 'TRUE' || rawChecklist === '1';

    members.push({
      nip,
      nama,
      salesToday,
      checklistIntime,
      isUnlocked: salesToday >= currentTarget,
      lastUpdated: new Date().toISOString(),
    });
  }

  return members;
}

/**
 * Splits a CSV line into cells, respecting quotes (kept for backward compatibility, unused if parseGoogleSheetsCsv does it in one pass)
 */
function parseCsvRow(line: string): string[] {
  const row: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentCell);
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  row.push(currentCell);
  return row;
}

/**
 * Formats a raw number to Indonesian Rupiah (IDR) without decimals.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convert Indonesian format formatted number (or standard string) to raw number.
 * Handles strings like "2,142,703", "Rp 18.000.000", "Rp18,000,000" etc.
 */
export function parseCurrencyToNumber(val: string): number {
  if (!val) return 0;
  
  // Clean currency symbols and spaces
  let cleaned = val.replace(/Rp/gi, '').replace(/\s/g, '');
  
  // Strip trailing decimals like .00 or ,00
  cleaned = cleaned.replace(/[\.,]\d{2}$/, '');
  
  // Remove all remaining separators (dots and commas)
  cleaned = cleaned.replace(/[\.,]/g, '');
  
  let parsed = parseInt(cleaned, 10);
  
  // If the parsed number is less than 1000, e.g., "187" representing 187.000
  if (!isNaN(parsed) && parsed > 0 && parsed < 1000) {
    parsed = parsed * 1000;
  }
  return isNaN(parsed) ? 0 : parsed;
}

// parsePastedSalesData removed to streamline sheet integration only.

/**
 * Calculates aggregate stats for SMTs
 */
export function calculateStats(members: SmtMember[]): AppStats {
  const totalSmt = members.length;
  let totalSales = 0;
  let unlockedCount = 0;

  for (const m of members) {
    totalSales += m.salesToday;
    if (m.isUnlocked) {
      unlockedCount++;
    }
  }

  const lockedCount = totalSmt - unlockedCount;
  const unlockedPercentage = totalSmt > 0 ? Math.round((unlockedCount / totalSmt) * 100) : 0;
  const averageSales = totalSmt > 0 ? Math.round(totalSales / totalSmt) : 0;

  return {
    totalSmt,
    totalSales,
    unlockedCount,
    lockedCount,
    unlockedPercentage,
    averageSales,
  };
}
