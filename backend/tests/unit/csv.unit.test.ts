import { parseCsv } from '../../src/utils/csv.util';

describe('csv.util — parseCsv() (004 Bulk CSV Import batch, FR-032)', () => {
  it('parses a simple comma-separated table with a header row', () => {
    expect(parseCsv('email,reason\na@example.com,VIP\nb@example.com,Trial')).toEqual([
      ['email', 'reason'],
      ['a@example.com', 'VIP'],
      ['b@example.com', 'Trial'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    expect(parseCsv('email,reason\na@example.com,"Referred by Jane, VIP"')).toEqual([
      ['email', 'reason'],
      ['a@example.com', 'Referred by Jane, VIP'],
    ]);
  });

  it('handles doubled-quote escaping inside a quoted field', () => {
    expect(parseCsv('email,reason\na@example.com,"Said ""hello"" to me"')).toEqual([
      ['email', 'reason'],
      ['a@example.com', 'Said "hello" to me'],
    ]);
  });

  it('handles CRLF line endings identically to LF', () => {
    expect(parseCsv('email,reason\r\na@example.com,VIP\r\n')).toEqual([
      ['email', 'reason'],
      ['a@example.com', 'VIP'],
    ]);
  });

  it('drops a single trailing empty row from a trailing newline, but keeps genuinely blank interior rows', () => {
    expect(parseCsv('email\na@example.com\n')).toEqual([['email'], ['a@example.com']]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('handles a quoted field spanning an embedded newline', () => {
    expect(parseCsv('email,reason\na@example.com,"Line one\nLine two"')).toEqual([
      ['email', 'reason'],
      ['a@example.com', 'Line one\nLine two'],
    ]);
  });
});
