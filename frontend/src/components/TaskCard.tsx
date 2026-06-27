import { useNavigate } from 'react-router-dom';
import { TaskRequest, CATEGORY_META } from '../types';
import { slugify } from '../store';

export default function TaskCard({ task }: { task: TaskRequest }) {
  const navigate = useNavigate();
  
  // Safe category fallback
  const cat = CATEGORY_META[task.category] || {
    label: task.category || 'General Initiative',
    emoji: '📋',
    color: '#8c2424'
  };
  
  const progress = Math.min((task.volunteers.length / task.volunteersNeeded) * 100, 100);
  
  // Safe date parsing fallback
  let eventDate = 'Upcoming';
  if (task.eventDate) {
    const parsed = new Date(task.eventDate);
    if (!isNaN(parsed.getTime())) {
      eventDate = parsed.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    }
  }

  // Safe description fallback and truncation
  const descText = (task.shortDescription || task.description || 'Join this local civic initiative to help improve public areas and drive measurable social impact across the capital.').trim();
  const truncatedDesc = descText.length > 140 ? descText.slice(0, 140) + '...' : descText;

  return (
    <div
      className="card task-card"
      onClick={() => navigate(`/initiatives/${slugify(task.title)}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/initiatives/${slugify(task.title)}`)}
    >
      <div className="task-card-image-wrapper">
        <img
          src={`/categories/${task.category || 'other'}.jpg`}
          alt={task.title}
          className="task-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/categories/other.jpg';
          }}
        />
      </div>

      <div style={{ padding: '20px 24px 10px' }}>
        <span
          className="category-tag-small"
          style={{ 
            color: cat.color, 
            fontWeight: 700, 
            fontSize: '0.68rem', 
            letterSpacing: '0.04em', 
            textTransform: 'uppercase', 
            display: 'inline-block',
            background: cat.color + '08',
            padding: '2px 8px',
            borderRadius: '4px',
            marginBottom: '6px' 
          }}
        >
          {cat.label}
        </span>
        <h3 className="task-card-title" style={{ fontSize: '1.05rem', margin: '4px 0 0 0' }}>{task.title || 'Civic Initiative'}</h3>
      </div>

      <div className="task-card-body">
        <p>{truncatedDesc}</p>
      </div>

      <div style={{ padding: '0 24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>👥 {task.volunteers.length} / {task.volunteersNeeded || 5} volunteers</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar" style={{ height: '5px', borderRadius: '2.5px' }}>
          <div className="progress-fill" style={{ width: `${progress}%`, height: '100%', borderRadius: '2.5px' }} />
        </div>
      </div>

      <div className="task-card-footer">
        <div className="info-item">
          📍 {task.locality || 'Delhi'}, {task.city || 'Delhi'}
        </div>
        <div className="info-item">
          📅 {eventDate}
        </div>
      </div>
    </div>
  );
}
