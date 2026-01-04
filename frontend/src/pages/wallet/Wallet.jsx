import { useState, useEffect } from 'react';
import { walletAPI, purchaseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCreditCard, FiX } from 'react-icons/fi';

const Wallet = () => {
  const { user, refreshUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [showSubscription, setShowSubscription] = useState(false);

  const SUBSCRIPTION_PRICE = Number(import.meta.env.VITE_MONTHLY_SUBSCRIPTION_PRICE) || 479;

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions()
      ]);
      setWallet(walletResponse.data.data);
      setTransactions(transactionsResponse.data.data.transactions);
    } catch (error) {
      toast.error('Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    const amount = Number(topupAmount);

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await walletAPI.topup({ amount });
      toast.success('Wallet topped up successfully!');
      await refreshUser();
      await fetchWalletData();
      setShowTopup(false);
      setTopupAmount('');
    } catch (error) {
      toast.error('Failed to top up wallet');
    }
  };

  const handleSubscribe = async () => {
    if (wallet.balance < SUBSCRIPTION_PRICE) {
      toast.error('Insufficient balance. Please top up your wallet first.');
      return;
    }

    try {
      await purchaseAPI.purchaseSubscription();
      toast.success('PLUS subscription activated!');
      await refreshUser();
      await fetchWalletData();
      setShowSubscription(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to activate subscription');
    }
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
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Wallet</h1>
          <p className="mt-2 text-gray-400">Manage your balance and transactions</p>
        </div>

        {/* Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-2xl shadow-xl shadow-green-500/20 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Current Balance</p>
                <p className="text-4xl font-bold mt-2 text-white">₹{wallet?.balance || 0}</p>
              </div>
              <FiDollarSign className="text-5xl text-white/30" />
            </div>
            <button
              onClick={() => setShowTopup(true)}
              className="mt-4 px-4 py-2.5 bg-white text-green-700 rounded-xl hover:bg-green-50 w-full font-semibold transition-all shadow-lg"
            >
              Top Up Wallet
            </button>
          </div>

          <div className="bg-[#18181b] p-6 rounded-2xl shadow-xl border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Earnings</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">₹{wallet?.totalEarnings || 0}</p>
              </div>
              <FiTrendingUp className="text-4xl text-blue-400/50" />
            </div>
          </div>

          <div className="bg-[#18181b] p-6 rounded-2xl shadow-xl border border-[#27272a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Spent</p>
                <p className="text-3xl font-bold text-red-400 mt-2">₹{wallet?.totalSpent || 0}</p>
              </div>
              <FiTrendingDown className="text-4xl text-red-400/50" />
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 rounded-2xl shadow-2xl shadow-purple-500/20 p-6 mb-8 text-white border border-purple-500/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">PLUS Subscription</h3>
              <p className="mt-2 text-purple-100">
                {user?.hasActiveSubscription
                  ? `Active until ${new Date(user.subscription.endDate).toLocaleDateString()}`
                  : 'Unlock AI features and premium content'}
              </p>
              {!user?.hasActiveSubscription && (
                <p className="mt-2 text-xl font-bold">₹{SUBSCRIPTION_PRICE}/month</p>
              )}
            </div>
            {!user?.hasActiveSubscription && (
              <button
                onClick={() => setShowSubscription(true)}
                className="px-6 py-3 bg-white text-purple-700 rounded-xl hover:bg-purple-50 font-semibold transition-all shadow-lg whitespace-nowrap"
              >
                Subscribe Now
              </button>
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#18181b] rounded-2xl shadow-xl border border-[#27272a]">
          <div className="p-6 border-b border-[#27272a]">
            <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#27272a]">
                <thead className="bg-[#27272a]/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-[#27272a]/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                            transaction.type === 'CREDIT'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                        transaction.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'CREDIT' ? '+' : '-'}₹{transaction.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        ₹{transaction.balanceAfter}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top-up Modal */}
        {showTopup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#18181b] rounded-2xl p-8 max-w-md w-full border border-[#27272a] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Top Up Wallet</h2>
                <button onClick={() => setShowTopup(false)} className="p-2 hover:bg-[#27272a] rounded-lg transition-colors">
                  <FiX className="text-gray-400 text-xl" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="100"
                    min="1"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-3">Quick amounts:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 2000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setTopupAmount(amount.toString())}
                        className="px-3 py-2 bg-[#27272a] border border-[#3f3f46] text-gray-300 rounded-xl hover:bg-[#3f3f46] transition-colors font-medium"
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleTopup}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg shadow-purple-500/20"
                  >
                    Top Up
                  </button>
                  <button
                    onClick={() => setShowTopup(false)}
                    className="flex-1 border border-[#3f3f46] text-gray-300 py-3 rounded-xl hover:bg-[#27272a] font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        {showSubscription && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#18181b] rounded-2xl p-8 max-w-md w-full border border-[#27272a] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Subscribe to PLUS</h2>
                <button onClick={() => setShowSubscription(false)} className="p-2 hover:bg-[#27272a] rounded-lg transition-colors">
                  <FiX className="text-gray-400 text-xl" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
                  <p className="text-2xl font-bold text-purple-400">₹{SUBSCRIPTION_PRICE}/month</p>
                  <ul className="mt-4 space-y-2.5 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Access to AI-powered summaries
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Automatic quiz generation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Flashcard creation
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Priority support
                    </li>
                  </ul>
                </div>
                <div className="bg-[#27272a] rounded-xl p-4 border border-[#3f3f46]">
                  <p className="text-sm text-gray-400">
                    Current Balance: <span className="font-bold text-white">₹{wallet?.balance || 0}</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSubscribe}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg shadow-purple-500/20"
                  >
                    Subscribe Now
                  </button>
                  <button
                    onClick={() => setShowSubscription(false)}
                    className="flex-1 border border-[#3f3f46] text-gray-300 py-3 rounded-xl hover:bg-[#27272a] font-semibold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;