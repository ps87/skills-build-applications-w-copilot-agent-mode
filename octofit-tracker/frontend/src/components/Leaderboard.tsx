import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; leaderboard: Entry[] };

export default function Leaderboard() {
  const [state, setState] = useState<LeaderboardState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setState({ status: 'loaded', leaderboard: leaderboard ?? [] });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
        {state.status === 'error' && <p role="alert">Unable to load leaderboard.</p>}
        {state.status === 'loaded' && state.leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
        {state.status === 'loaded' && state.leaderboard.length > 0 && (
          <ol className="list-group list-group-numbered list-group-flush">
            {state.leaderboard.map((entry) => (
              <li className="list-group-item d-flex justify-content-between px-0" key={entry.rank}>
                <span>{entry.teamName}</span>
                <strong>{entry.totalPoints} points</strong>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
