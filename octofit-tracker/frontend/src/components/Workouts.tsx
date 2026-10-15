import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; focus?: string; minutes?: number; reason?: string };
type WorkoutState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; suggestions: Suggestion[] };

export default function Workouts() {
  const [state, setState] = useState<WorkoutState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const email = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${email}`)
      .then(({ suggestions }) => {
        if (active) setState({ status: 'loaded', suggestions: suggestions ?? [] });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
        {state.status === 'error' && <p role="alert">Unable to load workout suggestions.</p>}
        {state.status === 'loaded' && state.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
        {state.status === 'loaded' && state.suggestions.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.suggestions.map((suggestion) => (
              <li className="list-group-item px-0" key={suggestion.title}>
                <strong>{suggestion.title}</strong>
                {suggestion.focus && <span className="ms-2">Focus: {suggestion.focus}</span>}
                {suggestion.minutes !== undefined && <span className="ms-2">{suggestion.minutes} min</span>}
                {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
