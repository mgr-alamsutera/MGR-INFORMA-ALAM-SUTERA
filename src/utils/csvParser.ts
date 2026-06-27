import { SmtMember, AppStats } from '../types';

/**
 * Parses a standard CSV string from Google Sheets, handling quotes and commas.
 */
export function parseGoogleSheetsCsv(csvText: string): SmtMember[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  // Split lines while keeping content within quotes intact
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === '\n' && !inQuotes) {
      lines.push(currentLine.trim());
      currentLine = '';
    } else if (char === '\r' && !inQuotes) {
      // Ignore carriage returns
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine.trim());
  }

  if (lines.length === 0) return [];

  // Parse headers
  const headers = parseCsvRow(lines[0]);
  const nipIndex = headers.findIndex(h => h.toUpperCase().includes('NIP'));
  const namaIndex = headers.findIndex(h => h.toUpperCase().includes('NAMA'));
  const salesIndex = headers.findIndex(h => h.toUpperCase().includes('SALES') || h.toUpperCase().includes('SALE'));
  const checklistIndex = headers.findIndex(h => h.toUpperCase().includes('CHEKLIST') || h.toUpperCase().includes('CHECKLIST') || h.toUpperCase().includes('INTIME'));

  const members: SmtMember[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    const row = parseCsvRow(line);
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
      isUnlocked: salesToday >= 18000000,
      lastUpdated: new Date().toISOString(),
    });
  }

  return members;
}

/**
 * Splits a CSV line into cells, respecting quotes
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
  
  // Detect if the string uses dots or commas as decimal separators
  // For Indonesian sales reporting, normally we have either "2,142,703" (comman-separated thousands)
  // or "2.142.703" (dot-separated thousands).
  // Let's remove ALL separators, but be careful with decimals.
  // Generally sales are integer Rupiahs.
  
  // If there's a dot at index of thousands, e.g. "2.142.703"
  // Let's strip all non-numeric except potential minus sign.
  // We can just strip dots and commas.
  cleaned = cleaned.replace(/[\.,]/g, '');
  
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse pasted text (can be TSV from Google Sheets/Excel or raw text).
 * Tries to identify rows containing NIP, Nama, and Sales figures.
 */
export function parsePastedSalesData(pastedText: string, existingMembers: SmtMember[]): {
  updatedMembers: SmtMember[];
  logs: string[];
} {
  const lines = pastedText.split(/\r?\n/);
  const updatedMembers = [...existingMembers];
  const logs: string[] = [];
  let successCount = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Split by Tab (classic Excel/Google Sheet copy-paste)
    const columns = line.split('\t').map(c => c.trim());

    let nip = '';
    let salesAmount = -1;
    let name = '';
    let checklist = false;

    // Try to identify cells:
    // NIP: 6-digit numeric string
    // Sales: Look for currency formatting, numbers over 1000, or numbers at index 2 or 3
    // Name: Alphabetical string
    
    // Pattern matching cells
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (!col) continue;

      // Check if it's a 6-digit NIP (e.g. 195142, 177535)
      if (/^\d{5,6}$/.test(col)) {
        nip = col;
      } else if (col.toUpperCase() === 'TRUE' || col.toUpperCase() === 'FALSE') {
        checklist = col.toUpperCase() === 'TRUE';
      } else {
        // Check if it looks like a name (only alphabets, spaces, dots)
        if (name === '' && /^[a-zA-Z\s\.,\(\)]+$/.test(col) && col.length > 3 && !['NAMA', 'NIP', 'SALES', 'TODAY', 'TRUE', 'FALSE', 'CHEKLIST', 'INTIME'].includes(col.toUpperCase())) {
          name = col;
        }

        // Check if it looks like money
        const numericVal = parseCurrencyToNumber(col);
        if (numericVal > 0 && salesAmount === -1) {
          // If the column heading or content is numeric, treat it as sales
          salesAmount = numericVal;
        }
      }
    }

    // Fallback: If we couldn't match dynamically but we have columns:
    if (columns.length >= 3) {
      if (!nip && /^\d+$/.test(columns[0])) {
        nip = columns[0];
      }
      if (!name && columns[1] && isNaN(Number(columns[1]))) {
        name = columns[1];
      }
      if (salesAmount === -1) {
        salesAmount = parseCurrencyToNumber(columns[2]);
      }
    }

    if (nip) {
      // Find matching SMT in existing list
      const index = updatedMembers.findIndex(m => m.nip === nip);
      if (index !== -1) {
        const oldSales = updatedMembers[index].salesToday;
        // Update sales amount if found in copy-paste
        if (salesAmount !== -1) {
          updatedMembers[index] = {
            ...updatedMembers[index],
            salesToday: salesAmount,
            isUnlocked: salesAmount >= 18000000,
            isManualOverride: true,
            lastUpdated: new Date().toISOString()
          };
          successCount++;
          logs.push(`Updated ${updatedMembers[index].nama} (NIP: ${nip}): ${formatRupiah(oldSales)} -> ${formatRupiah(salesAmount)}`);
        }
        
        // Also update checklist if provided
        if (line.toUpperCase().includes('TRUE') || line.toUpperCase().includes('FALSE')) {
          const checklistVal = line.toUpperCase().includes('TRUE');
          updatedMembers[index].checklistIntime = checklistVal;
        }
      } else {
        // If it's a new SMT not in the database, we can append them!
        if (name && salesAmount !== -1) {
          const newSmt: SmtMember = {
            nip,
            nama: name,
            salesToday: salesAmount,
            checklistIntime: checklist,
            isUnlocked: salesAmount >= 18000000,
            isManualOverride: true,
            lastUpdated: new Date().toISOString()
          };
          updatedMembers.push(newSmt);
          successCount++;
          logs.push(`Added new SMT ${name} (NIP: ${nip}) with sales: ${formatRupiah(salesAmount)}`);
        }
      }
    }
  }

  if (successCount === 0) {
    logs.push("Warning: No matching NIPs found in the pasted content. Ensure you copy the 'NIP' column from your spreadsheet.");
  }

  return { updatedMembers, logs };
}

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
