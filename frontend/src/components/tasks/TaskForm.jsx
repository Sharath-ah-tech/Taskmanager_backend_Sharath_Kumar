import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const TaskForm = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const isAdmin = Boolean(user?.is_superuser);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'green_light',
    group: '',
    due_date: '',
    is_enabled: true
  });

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupsRes = await api.get('/groups/');
        const groupList = groupsRes.data.results || groupsRes.data;
        setGroups(groupList);

        if (groupList.length > 0 && !isEditing) {
          setFormData(prev => ({ ...prev, group: groupList[0].id }));
        }

        if (isEditing) {
          const taskRes = await api.get(`/tasks/${id}/`);
          const task = taskRes.data;
          setFormData({
            title: task.title,
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'green_light',
            group: task.group?.id || task.group || '',
            due_date: task.due_date ? task.due_date.substring(0, 16) : '',
            is_enabled: task.is_enabled !== false
          });
        }
      } catch (err) {
        console.error('Failed to load required data:', err);
        setError('Failed to load required data.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToSubmit = isEditing && !isAdmin
        ? { status: formData.status }
        : { ...formData };

      if (!dataToSubmit.due_date) delete dataToSubmit.due_date;

      if (isEditing) {
        await api.patch(`/tasks/${id}/`, dataToSubmit);
      } else {
        await api.post('/tasks/', dataToSubmit);
      }
      navigate(isAdmin ? '/admin' : '/tasks');
    } catch (err) {
      setError(err.response?.data?.error || Object.values(err.response?.data || {})[0] || 'An error occurred while saving the task.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;

  const statusClass = formData.status === 'completed' ? 'completed' : 'pending';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{isEditing ? (isAdmin ? 'Edit Task' : 'Update Status') : 'Create New Task'}</h1>
        <Link to={isAdmin ? '/admin' : '/tasks'} className="btn btn-outline">Back</Link>
      </div>

      <div className="glass-card">
        {error && <div className="alert alert-error">{error}</div>}

        {groups.length === 0 && !isEditing ? (
          <div className="alert alert-warning mb-6">
            You need to be part of at least one group to create a task. <Link to="/groups/new" className="font-bold underline ml-1">Create a Group</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {isEditing && !isAdmin ? (
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="flex items-center gap-4">
                  <span className={`status-light ${statusClass}`} title={formData.status} aria-label={formData.status}></span>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="E.g., Complete quarterly report"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add more details about this task..."
                  ></textarea>
                </div>

                <div className="grid-cards mb-6" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group mb-0">
                    <label className="form-label">Status</label>
                    <div className="flex items-center gap-4">
                      <span className={`status-light ${statusClass}`} title={formData.status} aria-label={formData.status}></span>
                      <select
                        className="form-input"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group mb-0">
                    <label className="form-label">Group</label>
                    <select
                      className="form-input"
                      value={formData.group}
                      onChange={e => setFormData({ ...formData, group: e.target.value })}
                      required
                    >
                      <option value="" disabled>Select a group</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isAdmin && (
                  <div className="grid-cards mb-6" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group mb-0">
                      <label className="form-label">Due Date</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={formData.due_date}
                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>

                    <div className="form-group mb-0">
                      <label className="form-label">Task Availability</label>
                      <label className="flex items-center gap-3 form-input" style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.is_enabled}
                          onChange={e => setFormData({ ...formData, is_enabled: e.target.checked })}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                        />
                        Enabled
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-4 mt-8">
              <Link to={isAdmin ? '/admin' : '/tasks'} className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Task')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TaskForm;
