import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members?: string[] };
type TeamState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; teams: Team[] };

export default function Teams() {
  const [state, setState] = useState<TeamState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams }) => {
        if (active) setState({ status: 'loaded', teams: teams ?? [] });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {state.status === 'loading' && <p role="status">Loading teams...</p>}
        {state.status === 'error' && <p role="alert">Unable to load teams.</p>}
        {state.status === 'loaded' && state.teams.length === 0 && <p>No teams yet.</p>}
        {state.status === 'loaded' && state.teams.length > 0 && (
          <ul className="list-group list-group-flush">
            {state.teams.map((team) => (
              <li className="list-group-item px-0" key={team.name}>
                <strong>{team.name}</strong>
                {team.mascot && <span className="ms-2">Mascot: {team.mascot}</span>}
                {team.members && team.members.length > 0 && <p className="mb-0">Members: {team.members.join(', ')}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
