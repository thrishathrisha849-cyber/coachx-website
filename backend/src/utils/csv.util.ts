/**
 * A minimal, RFC 4180-correct CSV parser — added for the 004 Bulk CSV
 * Import batch (FR-032) rather than a new npm dependency, since the
 * parsing surface needed here is small and fully bounded (comma-separated
 * fields, optional double-quote quoting, doubled-quote escaping, and
 * CRLF/LF line endings). Returns rows as plain string arrays; the caller
 * is responsible for header/column-mapping semantics.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      pushRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // Final field/row if the text didn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  // Drop a single trailing fully-empty row (a common trailing-newline artifact).
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return rows;
}
