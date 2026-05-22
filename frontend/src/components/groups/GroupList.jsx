import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getGroups, deleteGroup } from '../../services/groups';

const GroupList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await getGroups();
      setGroups(res.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroups();
  }, [fetchGroups]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete group?')) {
      await deleteGroup(id);
      fetchGroups();
    }
  };

  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Link to="/groups/new" className="bg-green-600 text-white px-4 py-2 rounded">+ New Group</Link>
      </div>
      <div className="grid gap-4">
        {groups.map(group => (
          <div key={group.id} className="border p-4 rounded bg-white shadow">
            <div className="flex justify-between">
              <Link to={`/groups/${group.id}`} className="text-xl font-semibold text-blue-600">{group.name}</Link>
              <button onClick={() => handleDelete(group.id)} className="text-red-600">Delete</button>
            </div>
            <p className="text-gray-600 mt-1">{group.description}</p>
            <p className="text-sm text-gray-500 mt-2">Members: {group.member_count}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default GroupList;