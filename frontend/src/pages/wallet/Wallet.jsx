import { useState, useEffect } from 'react';
import { walletAPI, purchaseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCreditCard } from 'react-icons/fi';

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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="mt-2 text-gray-600">Manage your balance and transactions</p>
      </div>

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Current Balance</p>
              <p className="text-4xl font-bold mt-2">₹{wallet?.balance || 0}</p>
            </div>
            <FiDollarSign className="text-5xl opacity-50" />
          </div>
          <button
            onClick={() => setShowTopup(true)}
            className="mt-4 px-4 py-2 bg-white text-green-600 rounded-md hover:bg-gray-100 w-full font-medium"
          >
            Top Up Wallet
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{wallet?.totalEarnings || 0}</p>
            </div>
            <FiTrendingUp className="text-4xl text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">₹{wallet?.totalSpent || 0}</p>
            </div>
            <FiTrendingDown className="text-4xl text-red-600" />
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">PLUS Subscription</h3>
            <p className="mt-2 opacity-90">
              {user?.hasActiveSubscription
                ? `Active until ${new Date(user.subscription.endDate).toLocaleDateString()}`
                : 'Unlock AI features and premium content'}
            </p>
            {!user?.hasActiveSubscription && (
              <p className="mt-2 text-lg font-semibold">₹{SUBSCRIPTION_PRICE}/month</p>
            )}
          </div>
          {!user?.hasActiveSubscription && (
            <button
              onClick={() => setShowSubscription(true)}
              className="px-6 py-3 bg-white text-purple-600 rounded-md hover:bg-gray-100 font-medium"
            >
              Subscribe Now
            </button>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          transaction.type === 'CREDIT'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}₹{transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Top Up Wallet</h2>
            <form onSubmit={handleTopup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <p>Quick amounts:</p>
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 2000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTopupAmount(amount.toString())}
                      className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  Top Up
                </button>
                <button
                  type="button"
                  onClick={() => setShowTopup(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Subscribe to PLUS</h2>
            <div className="mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-lg font-semibold text-purple-900">₹{SUBSCRIPTION_PRICE}/month</p>
                <ul className="mt-4 space-y-2 text-sm text-purple-800">
                  <li>✓ Access to AI-powered summaries</li>
                  <li>✓ Automatic quiz generation</li>
                  <li>✓ Flashcard creation</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Current Balance: <span className="font-bold">₹{wallet?.balance || 0}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubscribe}
                className="flex-1 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
              >
                Subscribe Now
              </button>
              <button
                onClick={() => setShowSubscription(false)}
                className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
