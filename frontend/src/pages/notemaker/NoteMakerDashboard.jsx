import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiDollarSign, FiEye, FiShoppingCart, FiEdit, FiTrash } from 'react-icons/fi';
import { toast } from 'react-toastify';

const NoteMakerDashboard = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyNotes();
  }, []);

  const fetchMyNotes = async () => {
    try {
      const response = await notesAPI.getMine();
      setNotes(response.data.data.notes);
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await notesAPI.delete(id);
      toast.success('Note deleted successfully');
      fetchMyNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      PAUSED_FOR_REVIEW: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
      DRAFT: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">NoteMaker Dashboard</h1>
            <p className="mt-2 text-gray-400">Manage your notes and track earnings</p>
          </div>
          <Link
            to="/notemaker/create"
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg shadow-purple-500/20"
          >
            <FiPlus /> Create New Note
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#18181b] p-6 rounded-2xl shadow-xl border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Earnings</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400 mt-1">₹{Number(user?.totalEarnings || 0).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <FiDollarSign className="text-3xl text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] p-6 rounded-2xl shadow-xl border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Notes</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-400 mt-1">{notes.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <FiEdit className="text-3xl text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] p-6 rounded-2xl shadow-xl border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Views</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-400 mt-1">
                  {notes.reduce((sum, note) => sum + note.views, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <FiEye className="text-3xl text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] p-6 rounded-2xl shadow-xl border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Purchases</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-400 mt-1">
                  {notes.reduce((sum, note) => sum + note.purchases, 0)}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <FiShoppingCart className="text-3xl text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* My Notes */}
        <div className="bg-[#18181b] rounded-2xl shadow-xl border border-[#27272a]">
          <div className="p-6 border-b border-[#27272a]">
            <h2 className="text-2xl font-bold text-white">My Notes</h2>
          </div>

          {notes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-4">You haven't created any notes yet</p>
              <Link
                to="/notemaker/create"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg shadow-purple-500/20"
              >
                Create Your First Note
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#27272a]">
                <thead className="bg-[#27272a]/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {notes.map((note) => (
                    <tr key={note._id} className="hover:bg-[#27272a]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-white">{note.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">{note.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-white">
                          {note.isFree ? (
                            <span className="text-cyan-400">FREE</span>
                          ) : (
                            <span className="text-purple-400">₹{note.price}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(note.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <FiEye size={14} className="text-purple-400" />
                            <span>{note.views} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiShoppingCart size={14} className="text-green-400" />
                            <span>{note.purchases} purchases</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400">★</span>
                            <span>{note.rating.average.toFixed(1)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex gap-3">
                          <Link
                            to={`/notes/${note._id}`}
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(note._id)}
                            className="text-red-400 hover:text-red-300 font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteMakerDashboard;