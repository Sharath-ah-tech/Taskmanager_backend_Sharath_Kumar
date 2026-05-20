import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getGroupDetail, getGroupMembers, addMember, removeMember, deleteGroup } from '../../services/groups';
import { useAuth } from '../../contexts/AuthContext';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // { type: 'error' | 'success', text: '' }

  useEffect(() => {
    fetchGroupAndMembers();
  }, [id]);

  const fetchGroupAndMembers = async () => {
    try {
      const [groupRes, membersRes] = await Promise.all([
        getGroupDetail(id),
        getGroupMembers(id)
      ]);
      setGroup(groupRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      console.error("Failed to fetch group details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setInviteLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await addMember(id, email, 'member');
      setMessage({ type: 'success', text: 'User invited successfully!' });
      setEmail('');
      fetchGroupAndMembers();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to invite user. Please check the email.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(id, userId);
        fetchGroupAndMembers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to remove member.');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you absolutely sure you want to delete this entire group? This action cannot be undone.')) {
      try {
        await deleteGroup(id);
        navigate('/groups');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete group.');
      }
    }
  };

  if (loading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;
  if (!group) return <div className="text-center mt-8 text-red-600 font-bold">Group not found or you don't have access.</div>;

  // Check current user's role in the group
  const currentUserId = user?.id || (user?.email ? members.find(m => m.user?.email === user.email)?.user?.id : null);
  const currentUserMembership = members.find(m => m.user?.id === currentUserId || m.user?.email === user?.email);
  const isOwnerOrAdmin = currentUserMembership?.role === 'owner' || currentUserMembership?.role === 'admin' || user?.is_admin;
  const isOwner = currentUserMembership?.role === 'owner' || user?.is_admin;

  return (
    <div className="animate-fade-in" style={{maxWidth: '900px', margin: '0 auto'}}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/groups" className="text-sm font-bold text-muted hover:underline mb-2 inline-block flex items-center gap-1" style={{color: 'var(--accent-primary)'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Groups
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {group.name}
            <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {members.length} Members
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          {isOwnerOrAdmin && (
            <Link to={`/groups/${id}/edit`} className="btn btn-outline">Edit Group</Link>
          )}
          {isOwner && (
            <button onClick={handleDeleteGroup} className="btn btn-danger">Delete Group</button>
          )}
        </div>
      </div>

      <div className="glass-card mb-8">
        <h2 className="text-xl font-bold mb-2">About this Group</h2>
        <p className="text-muted leading-relaxed" style={{whiteSpace: 'pre-wrap'}}>
          {group.description || <em>No description provided.</em>}
        </p>
      </div>

      <div className="grid-cards" style={{gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
        {/* Members List */}
        <div className="glass-card">
          <h2 className="text-xl font-bold mb-4">Members</h2>
          
          <div className="space-y-3">
            {members.map(m => {
              const memberEmail = m.user?.email || m.email;
              const isCurrentUser = memberEmail === user?.email;
              
              return (
                <div key={m.id} className="flex justify-between items-center p-3 rounded-lg border" style={{borderColor: 'var(--border-color)', background: isCurrentUser ? 'var(--bg-secondary)' : 'transparent'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold uppercase">
                      {memberEmail.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {memberEmail}
                        {isCurrentUser && <span className="text-xs bg-gray-200 text-gray-700 px-1.5 rounded">You</span>}
                      </div>
                      <div className="text-xs text-muted capitalize">{m.role}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Admins/owners can remove others (but not the owner). Users can remove themselves. */}
                    {((isOwnerOrAdmin && m.role !== 'owner') || isCurrentUser) && (
                      <button 
                        onClick={() => handleRemove(m.user?.id || m.id)} 
                        className="text-red-500 hover:text-red-700 text-sm font-semibold hover:underline"
                      >
                        {isCurrentUser ? 'Leave Group' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite Sidebar */}
        <div className="space-y-6">
          <div className="glass-card">
            <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{borderColor: 'var(--border-color)'}}>Invite New Member</h2>
            
            {isOwnerOrAdmin ? (
              <form onSubmit={handleAddMember}>
                {message.text && (
                  <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 p-3 text-sm`}>
                    {message.text}
                  </div>
                )}
                
                <div className="form-group mb-4">
                  <label className="form-label text-sm">User Email</label>
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="form-input text-sm" 
                    required
                  />
                  <p className="text-xs text-muted mt-1">The user must already be registered on the platform.</p>
                </div>
                
                <button type="submit" className="btn btn-primary btn-full text-sm py-2" disabled={inviteLoading || !email.trim()}>
                  {inviteLoading ? 'Sending...' : 'Invite to Group'}
                </button>
              </form>
            ) : (
              <div className="text-sm text-muted p-4 bg-gray-50 rounded-lg dark:bg-gray-800 text-center">
                Only group owners and admins can invite new members.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;