import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTaskById, addVolunteer } from '../store';
import { CATEGORY_META } from '../types';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TaskDetail({ addToast }: Props) {
  const { id } = useParams<{ id: string }>();
  const [showModal, setShowModal] = useState(false);
  const [task, setTask] = useState(() => getTaskById(id || ''));

  if (!task) {
    return (
      <div className="container page-section">
        <div className="empty-state">
          <div className="emoji">😕</div>
          <h3>Task not found</h3>
          <p>This initiative may have been removed or doesn't exist.</p>
          <Link to="/browse" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Tasks</Link>
        </div>
      </div>
    );
  }

  const cat = CATEGORY_META[task.category];
  const progress = Math.min((task.volunteers.length / task.volunteersNeeded) * 100, 100);
  const eventDate = new Date(task.eventDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const avatarColors = ['#E85D26', '#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

  const handleVolunteer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string).trim();
    const email = (fd.get('email') as string).trim();
    const phone = (fd.get('phone') as string).trim();
    const message = (fd.get('message') as string).trim();

    const success = addVolunteer(task.id, { name, email, phone, message: message || undefined });
    if (success) {
      addToast(`Welcome aboard, ${name}! You're now a volunteer 🎉`, 'success');
      setTask(getTaskById(task.id));
      setShowModal(false);
    } else {
      addToast('This email is already registered for this task.', 'error');
    }
  };

  return (
    <div className="container page-section">
      <Link to="/browse" className="back-link">← Back to Browse</Link>

      <div className="task-detail">
        {/* Header */}
        <div className="task-detail-header">
          <div className="task-detail-tags">
            <span className="tag" style={{ background: cat.color + '15', color: cat.color }}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`status-badge status-${task.status}`}>{task.status}</span>
            {task.applicantType === 'group' && (
              <span className="tag" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                👥 Organization
              </span>
            )}
          </div>
          <h1>{task.title}</h1>
        </div>

        {/* Description */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>📋 About This Initiative</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {task.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="task-info-grid">
            <div className="info-block">
              <label>📅 Date</label>
              <span>{eventDate}</span>
            </div>
            <div className="info-block">
              <label>🕐 Time</label>
              <span>{task.eventTime}</span>
            </div>
            <div className="info-block">
              <label>📍 Location</label>
              <span>{task.address}</span>
            </div>
            <div className="info-block">
              <label>🏘️ Area</label>
              <span>{task.locality}, {task.city} — {task.pincode}</span>
            </div>
            <div className="info-block">
              <label>👤 Organized By</label>
              <span>{task.applicantName}{task.organizationName ? ` (${task.organizationName})` : ''}</span>
            </div>
            <div className="info-block">
              <label>📧 Contact</label>
              <span>{task.email}</span>
            </div>
          </div>
        </div>

        {/* Volunteer Progress */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: '1rem' }}>🤝 Volunteer Progress</h3>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              {task.volunteers.length} / {task.volunteersNeeded}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 12, borderRadius: 6 }}>
            <div className="progress-fill" style={{ width: `${progress}%`, borderRadius: 6 }} />
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 8 }}>
            {task.volunteersNeeded - task.volunteers.length > 0
              ? `${task.volunteersNeeded - task.volunteers.length} more volunteers needed!`
              : 'All volunteer spots are filled! 🎉'}
          </p>

          <button
            className="btn btn-primary"
            style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
            onClick={() => setShowModal(true)}
            disabled={task.volunteers.length >= task.volunteersNeeded}
          >
            🙋 Join as Volunteer
          </button>
        </div>

        {/* Volunteer List */}
        {task.volunteers.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>
              👥 Volunteers ({task.volunteers.length})
            </h3>
            <div className="volunteer-list">
              {task.volunteers.map((v, i) => (
                <div key={v.id} className="volunteer-item">
                  <div
                    className="volunteer-avatar"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="volunteer-info">
                    <div className="name">{v.name}</div>
                    {v.message && <div className="msg">"{v.message}"</div>}
                    <div className="time">
                      Joined {new Date(v.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Volunteer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>🙋 Join as Volunteer</h2>
            <p>Sign up to volunteer for <strong>{task.title}</strong></p>
            <form onSubmit={handleVolunteer}>
              <div className="form-group">
                <label htmlFor="vol-name">Your Name <span className="required">*</span></label>
                <input type="text" name="name" id="vol-name" required placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label htmlFor="vol-email">Email <span className="required">*</span></label>
                <input type="email" name="email" id="vol-email" required placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label htmlFor="vol-phone">Phone <span className="required">*</span></label>
                <input type="tel" name="phone" id="vol-phone" required placeholder="98XXXXXXXX" />
              </div>
              <div className="form-group">
                <label htmlFor="vol-message">Message (optional)</label>
                <textarea name="message" id="vol-message" rows={3} placeholder="Why do you want to volunteer?" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  ✓ Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
