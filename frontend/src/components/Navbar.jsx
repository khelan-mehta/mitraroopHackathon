import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBook, FiUser, FiLogOut, FiDollarSign, FiShield } from 'react-icons/fi';

const Navbar = () => {
  const { isAuthenticated, user, isNoteMaker, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FiBook className="text-blue-600 text-2xl" />
              <span className="text-xl font-bold text-gray-900">NotesMarket</span>
            </Link>

            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                to="/marketplace"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
              >
                Marketplace
              </Link>

              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}

              {isNoteMaker && (
                <Link
                  to="/notemaker"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  NoteMaker
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium flex items-center gap-1"
                >
                  <FiShield /> Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/wallet"
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <FiDollarSign />
                  <span className="font-medium">₹{user?.walletBalance || 0}</span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <FiUser />
                  )}
                  <span className="text-sm font-medium">{user?.name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  <FiLogOut />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
