import type { DigestRow, NightDigest } from '../digest/types.js';

function shown(value: string | null) {
  return value === null ? '—' : value;
}

function marked(row: DigestRow) {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

export function DigestPage({ night, digest }: { night: string; digest: NightDigest }) {
  const quiet = digest.rows.length === 0 && digest.badLines === 0;
  return (
    <>
      <h1>{night}</h1>
      {quiet ? <p>nothing ran</p> : null}
      {digest.rows.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((row) => (
              <tr class={marked(row) ? 'warn' : undefined}>
                <td>{row.job}</td>
                <td>{shown(row.owner)}</td>
                <td>{row.runs}</td>
                <td>{row.retries}</td>
                <td>{row.lastStatus}</td>
                <td>{shown(row.lastError)}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {digest.badLines > 0 ? <p class="mute">{digest.badLines} unreadable</p> : null}
    </>
  );
}
