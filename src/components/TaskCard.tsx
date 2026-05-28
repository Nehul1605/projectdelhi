import { useNavigate } from 'react-router-dom';
import { TaskRequest, CATEGORY_META } from '../types';

export default function TaskCard({ task }: { task: TaskRequest }) {
  const navigate = useNavigate();
  const cat = CATEGORY_META[task.category];
  const progress = Math.min((task.volunteers.length / task.volunteersNeeded) * 100, 100);
  const eventDate = new Date(task.eventDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className="card task-card"
      onClick={() => navigate(`/task/${task.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/task/${task.id}`)}
    >
      <div className="task-card-header">
        <div className="task-card-emoji" style={{ background: cat.color + '15' }}>
          {cat.emoji}
        </div>
        <div className="task-card-meta">
          <h3>{task.title}</h3>
          <span
            className="category-tag"
            style={{ background: cat.color + '15', color: cat.color }}
          >
            {cat.label}
          </span>
        </div>
      </div>

      <div className="task-card-body">
        <p>{task.description}</p>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>{task.volunteers.length} / {task.volunteersNeeded} volunteers</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="task-card-footer">
        <div className="info-item">
          📍 {task.locality}, {task.city}
        </div>
        <div className="info-item">
          📅 {eventDate}
        </div>
      </div>
    </div>
  );
}
