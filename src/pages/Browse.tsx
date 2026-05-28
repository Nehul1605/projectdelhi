import { useState, useMemo } from 'react';
import { getApprovedTasks } from '../store';
import { TaskCategory, CATEGORY_META } from '../types';
import TaskCard from '../components/TaskCard';

export default function Browse() {
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const allTasks = getApprovedTasks();

  const filtered = useMemo(() => {
    let list = allTasks;
    if (filter !== 'all') {
      list = list.filter(t => t.category === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.locality.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTasks, filter, search]);

  const categories = Object.entries(CATEGORY_META) as [TaskCategory, typeof CATEGORY_META[TaskCategory]][];

  return (
    <div className="container page-section">
      <div className="section-header">
        <h2>Browse Initiatives</h2>
        <p>Discover and join community projects happening across Delhi</p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: 480, margin: '0 auto 24px' }}>
        <input
          type="text"
          placeholder="🔍  Search by title, locality, or keyword..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          id="search-tasks"
        />
      </div>

      {/* Category Filter */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {categories.map(([key, meta]) => (
          <button
            key={key}
            className={`filter-chip ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {meta.emoji} {meta.label}
          </button>
        ))}
      </div>

      {/* Task Grid */}
      {filtered.length > 0 ? (
        <div className="task-grid">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <h3>No initiatives found</h3>
          <p>Try a different search term or category filter, or be the first to raise a task!</p>
        </div>
      )}
    </div>
  );
}
