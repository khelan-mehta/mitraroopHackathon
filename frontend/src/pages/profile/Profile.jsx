import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiEdit2, FiSave, FiX, FiStar, FiBook, FiAward } from 'react-icons/fi';

const Profile = () => {
  const { user, refreshUser, isNoteMaker } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    education: '',
    interests: '',
    subjects: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        education: user.education || '',
        interests: user.interests?.join(', ') || '',
        subjects: user.subjects?.join(', ') || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        bio: formData.bio,
        education: formData.education,
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i)
      };

      if (isNoteMaker) {
        updateData.subjects = formData.subjects.split(',').map(s => s.trim()).filter(s => s);
      }

      await userAPI.updateProfile(updateData);
      await refreshUser();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      education: user?.education || '',
      interests: user?.interests?.join(', ') || '',
      subjects: user?.subjects?.join(', ') || ''
    });
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] overflow-hidden shadow-2xl">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 px-6 py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-[#18181b] flex items-center justify-center overflow-hidden border-4 border-white/20 shadow-xl">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-4xl text-purple-400" />
                )}
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
                <p className="text-purple-100 text-sm mt-1">{user.email}</p>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    user.role === 'NOTEMAKER' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {user.role}
                  </span>
                  {user.hasActiveSubscription && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                      <FiStar size={12} /> PLUS
                    </span>
                  )}
                </div>
              </div>
              <div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 font-medium"
                  >
                    <FiEdit2 size={16} /> Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Education
                    </label>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      placeholder="e.g., B.Tech Computer Science"
                      className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Interests (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="interests"
                      value={formData.interests}
                      onChange={handleChange}
                      placeholder="e.g., Machine Learning, Web Development"
                      className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {isNoteMaker && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Teaching Subjects (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="subjects"
                        value={formData.subjects}
                        onChange={handleChange}
                        placeholder="e.g., Mathematics, Physics"
                        className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-semibold transition-all shadow-lg shadow-purple-500/20"
                  >
                    <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-6 py-3 border border-[#3f3f46] text-gray-300 rounded-xl hover:bg-[#27272a] font-semibold transition-all"
                  >
                    <FiX /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 p-5 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <FiAward className="text-green-400 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Wallet Balance</p>
                        <p className="text-2xl font-bold text-green-400">₹{user.walletBalance || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 p-5 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <FiStar className="text-purple-400 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Subscription</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {user.hasActiveSubscription ? 'PLUS' : 'FREE'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-5 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <FiBook className="text-blue-400 text-xl" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Spent</p>
                        <p className="text-2xl font-bold text-blue-400">₹{user.totalSpent || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="border-t border-[#27272a] pt-6">
                  <h3 className="text-xl font-bold mb-4 text-white">Profile Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Email</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Education</p>
                      <p className="text-white font-medium">{user.education || 'Not specified'}</p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-400 mb-1">Bio</p>
                      <p className="text-white font-medium">{user.bio || 'No bio added yet'}</p>
                    </div>

                    {user.interests && user.interests.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400 mb-2">Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {user.interests.map((interest, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-[#27272a] text-gray-300 rounded-lg text-sm border border-[#3f3f46]">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {isNoteMaker && user.subjects && user.subjects.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-400 mb-2">Teaching Subjects</p>
                        <div className="flex flex-wrap gap-2">
                          {user.subjects.map((subject, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm border border-purple-500/20">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Member Since</p>
                      <p className="text-white font-medium">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NoteMaker Stats */}
                {isNoteMaker && (
                  <div className="border-t border-[#27272a] pt-6">
                    <h3 className="text-xl font-bold mb-4 text-white">Creator Stats</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 p-5 rounded-xl border border-orange-500/20">
                        <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                        <p className="text-3xl font-bold text-orange-400">₹{user.totalEarnings || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;