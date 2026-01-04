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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="text-4xl text-gray-400" />
              )}
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-blue-100">{user.email}</p>
              <div className="mt-2 flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'ADMIN' ? 'bg-red-500' :
                  user.role === 'NOTEMAKER' ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {user.role}
                </span>
                {user.hasActiveSubscription && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 flex items-center gap-1">
                    <FiStar /> PLUS
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <FiEdit2 /> Edit Profile
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g., B.Tech Computer Science"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="interests"
                    value={formData.interests}
                    onChange={handleChange}
                    placeholder="e.g., Machine Learning, Web Development"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {isNoteMaker && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaching Subjects (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleChange}
                      placeholder="e.g., Mathematics, Physics"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FiX /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-full">
                      <FiAward className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Wallet Balance</p>
                      <p className="text-xl font-bold text-green-600">₹{user.walletBalance || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FiStar className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Subscription</p>
                      <p className="text-xl font-bold text-purple-600">
                        {user.hasActiveSubscription ? 'PLUS' : 'FREE'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <FiBook className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="text-xl font-bold text-blue-600">₹{user.totalSpent || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Education</p>
                    <p className="text-gray-900">{user.education || 'Not specified'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Bio</p>
                    <p className="text-gray-900">{user.bio || 'No bio added yet'}</p>
                  </div>

                  {user.interests && user.interests.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {user.interests.map((interest, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isNoteMaker && user.subjects && user.subjects.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-2">Teaching Subjects</p>
                      <div className="flex flex-wrap gap-2">
                        {user.subjects.map((subject, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="text-gray-900">
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
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Creator Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-orange-600">₹{user.totalEarnings || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
