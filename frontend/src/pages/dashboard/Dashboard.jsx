import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { purchaseAPI, userAPI } from '../../services/api';
import { FiBook, FiDollarSign, FiStar, FiTrendingUp, FiX } from 'react-icons/fi';
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
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Welcome, {user?.name}!</h1>
          <p className="mt-2 text-gray-400">Manage your notes, purchases, and account</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <FiDollarSign className="text-2xl text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-400">₹{user?.walletBalance || 0}</p>
              </div>
            </div>
            <Link 
              to="/wallet" 
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              Manage Wallet <span>→</span>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FiBook className="text-2xl text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Purchased Notes</p>
                <p className="text-2xl font-bold text-blue-400">{purchases.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <FiStar className="text-2xl text-purple-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Subscription</p>
                <p className="text-2xl font-bold text-purple-400">
                  {user?.subscription?.plan || 'FREE'}
                </p>
              </div>
            </div>
            {!user?.hasActiveSubscription && (
              <Link 
                to="/wallet" 
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                Upgrade to PLUS <span>→</span>
              </Link>
            )}
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <FiTrendingUp className="text-2xl text-orange-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Role</p>
                <p className="text-2xl font-bold text-orange-400">{user?.role}</p>
              </div>
            </div>
            {!isNoteMaker && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                Become a NoteMaker <span>→</span>
              </button>
            )}
          </div>
        </div>

        {/* My Purchases */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-800 p-6">
          <h2 className="text-2xl font-bold text-white mb-6">My Purchased Notes</h2>
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <FiBook className="text-5xl text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-6">You haven't purchased any notes yet</p>
              </div>
              <Link
                to="/marketplace"
                className="inline-block bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 font-medium transition-all transform hover:scale-[1.02]"
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
                  className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <FiBook className="text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white mb-1 line-clamp-2">
                        {purchase.note.title}
                      </h3>
                      <span className="inline-block px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
                        {purchase.note.subject}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                    <p className="text-sm text-green-400 font-semibold">₹{purchase.price}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Become a NoteMaker</h2>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX className="text-gray-400 text-xl" />
              </button>
            </div>
            
            <form onSubmit={handleUpgradeToNoteMaker} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  value={upgradeData.bio}
                  onChange={(e) => setUpgradeData({ ...upgradeData, bio: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  rows="3"
                  placeholder="Tell us about yourself..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={upgradeData.subjects}
                  onChange={(e) => setUpgradeData({ ...upgradeData, subjects: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Mathematics, Physics, Chemistry"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Education</label>
                <input
                  type="text"
                  value={upgradeData.education}
                  onChange={(e) => setUpgradeData({ ...upgradeData, education: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="B.Tech Computer Science"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 font-semibold transition-all transform hover:scale-[1.02]"
                >
                  Upgrade
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 border border-gray-700 text-gray-300 py-3 rounded-lg hover:bg-gray-800 font-semibold transition-all"
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