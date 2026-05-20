import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const GroupForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchGroup = async () => {
        try {
          const res = await api.get(`/groups/${id}/`);
          setFormData({
            name: res.data.name,
            description: res.data.description || ''
          });
        } catch (err) {
          setError('Failed to load group data.');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchGroup();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isEditing) {
        await api.patch(`/groups/${id}/`, formData);
      } else {
        await api.post('/groups/', formData);
      }
      navigate('/groups');
    } catch (err) {
      setError(err.response?.data?.error || Object.values(err.response?.data || {})[0] || 'An error occurred while saving the group.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;

  return (
    <div className="animate-fade-in" style={{maxWidth: '800px', margin: '0 auto'}}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Group' : 'Create New Group'}</h1>
        <Link to="/groups" className="btn btn-outline">Back to Groups</Link>
      </div>
      
      <div className="glass-card">
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              placeholder="E.g., Design Team"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-input"
              rows="4"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="What is this group for?"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-4 mt-8">
            <Link to="/groups" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Group')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupForm;
