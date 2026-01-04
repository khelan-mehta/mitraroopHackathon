import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';

const AdminPanel = () => {
  const [similarityQueue, setSimilarityQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [queueResponse, statsResponse] = await Promise.all([
        adminAPI.getSimilarityQueue(),
        adminAPI.getStats()
      ]);
      setSimilarityQueue(queueResponse.data.data.notes);
      setStats(statsResponse.data.data);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (noteId) => {
    try {
      await adminAPI.approveNote(noteId);
      toast.success('Note approved successfully');
      fetchData();
      setSelectedNote(null);
    } catch (error) {
      toast.error('Failed to approve note');
    }
  };

  const handleReject = async (noteId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await adminAPI.rejectNote(noteId, { reason });
      toast.success('Note rejected');
      fetchData();
      setSelectedNote(null);
    } catch (error) {
      toast.error('Failed to reject note');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-gray-600">Manage similarity reviews and platform stats</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-blue-600">{stats.users.total}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.users.noteMakers} NoteMakers</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Total Notes</p>
            <p className="text-2xl font-bold text-green-600">{stats.notes.total}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.notes.active} active</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.notes.pendingReview}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-purple-600">₹{stats.revenue}</p>
          </div>
        </div>
      )}

      {/* Similarity Queue */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiAlertTriangle className="text-yellow-600 text-xl" />
            <h2 className="text-xl font-bold">Similarity Review Queue</h2>
          </div>
        </div>

        {similarityQueue.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No notes pending review</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {similarityQueue.map((note) => (
              <div key={note._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{note.subject}</p>
                    <p className="text-sm text-gray-500 mt-2">{note.description}</p>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Similarity Score:</span>
                        <span className={`font-bold ${
                          note.similarityScore > 9 ? 'text-red-600' :
                          note.similarityScore > 7 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {note.similarityScore}/10
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        By: <span className="font-medium">{note.creator.name}</span> ({note.creator.email})
                      </div>
                    </div>

                    {note.similarityReason && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-800">
                          <strong>Reason:</strong> {note.similarityReason}
                        </p>
                      </div>
                    )}

                    {selectedNote === note._id && (
                      <div className="mt-4 p-4 bg-gray-100 rounded">
                        <h4 className="font-medium mb-2">Preview:</h4>
                        <div className="max-h-48 overflow-y-auto text-sm text-gray-700">
                          {note.pages.slice(0, 2).map((page, idx) => (
                            <div key={idx} className="mb-2">
                              <p className="font-medium">Page {page.pageNumber}:</p>
                              <p className="whitespace-pre-wrap">{page.content.substring(0, 300)}...</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedNote(selectedNote === note._id ? null : note._id)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      {selectedNote === note._id ? 'Hide' : 'Preview'}
                    </button>
                    <button
                      onClick={() => handleApprove(note._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(note._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
