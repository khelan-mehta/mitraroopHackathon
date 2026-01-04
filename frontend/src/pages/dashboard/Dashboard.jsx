import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { purchaseAPI, userAPI } from '../../services/api';
import { FiBook, FiDollarSign, FiStar, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user, refreshUser, isNoteMaker } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeData, setUpgradeData] = useState({
    bio: '',
    subjects: '',
    education: ''
  });

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await purchaseAPI.getMyPurchases();
      setPurchases(response.data.data.purchases);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToNoteMaker = async (e) => {
    e.preventDefault();
    try {
      const subjects = upgradeData.subjects.split(',').map(s => s.trim());
      await userAPI.upgradeToNoteMaker({
        bio: upgradeData.bio,
        subjects,
        education: upgradeData.education
      });
      toast.success('Upgraded to NoteMaker successfully!');
      await refreshUser();
      setShowUpgradeModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upgrade');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="mt-2 text-gray-600">Manage your notes, purchases, and account</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-600">₹{user?.walletBalance || 0}</p>
            </div>
            <FiDollarSign className="text-3xl text-green-600" />
          </div>
          <Link to="/wallet" className="mt-4 text-sm text-blue-600 hover:underline block">
            Manage Wallet →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Purchased Notes</p>
              <p className="text-2xl font-bold text-blue-600">{purchases.length}</p>
            </div>
            <FiBook className="text-3xl text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Subscription</p>
              <p className="text-2xl font-bold text-purple-600">
                {user?.subscription?.plan || 'FREE'}
              </p>
            </div>
            <FiStar className="text-3xl text-purple-600" />
          </div>
          {!user?.hasActiveSubscription && (
            <Link to="/wallet" className="mt-4 text-sm text-blue-600 hover:underline block">
              Upgrade to PLUS →
            </Link>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-2xl font-bold text-orange-600">{user?.role}</p>
            </div>
            <FiTrendingUp className="text-3xl text-orange-600" />
          </div>
          {!isNoteMaker && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="mt-4 text-sm text-blue-600 hover:underline block"
            >
              Become a NoteMaker →
            </button>
          )}
        </div>
      </div>

      {/* My Purchases */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">My Purchased Notes</h2>
        {purchases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't purchased any notes yet</p>
            <Link
              to="/marketplace"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map((purchase) => (
              <Link
                key={purchase._id}
                to={`/notes/${purchase.note._id}`}
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{purchase.note.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{purchase.note.subject}</p>
                <p className="text-sm text-green-600 font-medium">₹{purchase.price}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Purchased: {new Date(purchase.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Become a NoteMaker</h2>
            <form onSubmit={handleUpgradeToNoteMaker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={upgradeData.bio}
                  onChange={(e) => setUpgradeData({ ...upgradeData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={upgradeData.subjects}
                  onChange={(e) => setUpgradeData({ ...upgradeData, subjects: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="Mathematics, Physics, Chemistry"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <input
                  type="text"
                  value={upgradeData.education}
                  onChange={(e) => setUpgradeData({ ...upgradeData, education: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="B.Tech Computer Science"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Upgrade
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
