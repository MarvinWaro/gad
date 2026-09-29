import { Network, UserRound, UsersRound } from 'lucide-react';
import { organization } from '@/data/organization';

export function OrganizationalChart() {
    return (
        <section className="org-chart" aria-labelledby="organization-title">
            <header className="org-intro">
                <span className="org-eyebrow">
                    <Network aria-hidden="true" />
                    People & structure
                </span>
                <h2 id="organization-title">Organizational Chart</h2>
                <p>As presented in the earlier PHLGADIS site.</p>
            </header>
            <div className="org-stage">
                <div className="org-stage-label">
                    <span>Leadership</span>
                    <span>
                        {String(1 + organization.chairs.length).padStart(
                            2,
                            '0',
                        )}
                    </span>
                </div>
                <div className="org-leadership">
                    <div className="org-person org-oversight">
                        <span className="org-person-icon">
                            <Network aria-hidden="true" />
                        </span>
                        <h3>{organization.oversight.role}</h3>
                        <p>{organization.oversight.name}</p>
                    </div>
                    <div className="org-chairs">
                        {organization.chairs.map((person) => (
                            <div className="org-person" key={person.role}>
                                <span className="org-person-icon">
                                    <UserRound aria-hidden="true" />
                                </span>
                                <h3>{person.role}</h3>
                                <p>{person.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Roster title="Members" names={organization.members} />
            <Roster title="Secretariat" names={organization.secretariat} />
        </section>
    );
}

function Roster({ title, names }: { title: string; names: readonly string[] }) {
    const id = `organization-${title.toLowerCase()}`;

    return (
        <section
            className="org-roster"
            aria-labelledby={id}
            data-group={title.toLowerCase()}
        >
            <div className="org-roster-heading">
                <UsersRound aria-hidden="true" />
                <h3 id={id}>{title}</h3>
                <span>{names.length} people</span>
            </div>
            <ul>
                {names.map((name) => (
                    <li key={name}>
                        <UserRound aria-hidden="true" />
                        <span>{name}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
