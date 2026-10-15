import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; activities: Activity[] };

export default function Activities() {
  const [state, setState] = useState<ActivityState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities }) => {
        if (active) setState({ status: 'loaded', activities: activities ?? [] });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {state.status === 'loading' && <p role="status">Loading activities...</p>}
        {state.status === 'error' && <p role="alert">Unable to load activities.</p>}
        {state.status === 'loaded' && state.activities.length === 0 && <p>No activities yet.</p>}
        {state.status === 'loaded' && state.activities.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.activities.map((activity, index) => (
              <li className="list-group-item px-0" key={`${activity.type}-${index}`}>
                <strong>{activity.type}</strong>
                <span className="ms-3">{activity.minutes} min</span>
                <span className="ms-3">{activity.points} points</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
