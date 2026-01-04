import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiUser, FiLogOut, FiDollarSign, FiShield } from "react-icons/fi";

const Navbar = () => {
  const { isAuthenticated, user, isNoteMaker, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">NoteNex</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex md:items-center md:gap-6">
              <Link
                to="/marketplace"
                className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Marketplace
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <>
                  <Link
                    to="/community"
                    className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Forums
                  </Link>
                </>
              )}

              {isNoteMaker && (
                <Link
                  to="/notemaker"
                  className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  NoteMaker
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <FiShield /> Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Wallet Balance */}
                <Link
                  to="/wallet"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all"
                >
                  <FiDollarSign className="text-lg" />
                  <span className="font-semibold">
                    ₹{user?.walletBalance || 0}
                  </span>
                </Link>

                {/* User Profile */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg hover:bg-gray-800 border border-gray-800 transition-all"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-white hidden sm:block">
                    {user?.name}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 hover:border-red-500/30 transition-all"
                >
                  <FiLogOut />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 px-5 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
