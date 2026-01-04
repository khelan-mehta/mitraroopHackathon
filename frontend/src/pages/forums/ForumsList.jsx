import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FiMessageSquare,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiSend,
  FiSearch,
  FiChevronRight,
  FiThumbsUp,
  FiUser,
  FiArrowLeft,
  FiEdit2,
  FiStar,
} from "react-icons/fi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// API Service
const forumAPI = {
  
  getForums: () => axios.get(`${API_BASE_URL}/forum`),
  getThreads: (forumId, params) =>
    axios.get(`${API_BASE_URL}/forum/${forumId}/threads`, { params }),
  getThread: (threadId) =>
    axios.get(`${API_BASE_URL}/forum/thread/${threadId}`),
  createThread: (forumId, data, token) =>
    axios.post(`${API_BASE_URL}/forum/${forumId}/threads`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  addReply: (threadId, data, token) =>
    axios.post(`${API_BASE_URL}/forum/thread/${threadId}/reply`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  likeThread: (threadId, token) =>
    axios.post(
      `${API_BASE_URL}/forum/thread/${threadId}/like`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
};

// Forums List Component
export const ForumsList = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalThreads: 0,
    totalMembers: 0,
    activeToday: 0,
  });

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      const response = await forumAPI.getForums();
      const forumsData = response.data.data.forums;
      setForums(forumsData);

      // Calculate stats
      const totalThreads = forumsData.reduce((sum, f) => sum + f.threads, 0);
      const totalMembers = forumsData.reduce((sum, f) => sum + f.members, 0);
      setStats({
        totalThreads,
        totalMembers,
        activeToday: Math.floor(totalMembers * 0.05), // Estimate 5% active
      });
    } catch (error) {
      toast.error("Failed to load forums");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredForums = forums.filter(
    (forum) =>
      forum.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      forum.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-500/10 to-blue-600/10 border-blue-500/20",
      purple: "from-purple-500/10 to-purple-600/10 border-purple-500/20",
      green: "from-green-500/10 to-green-600/10 border-green-500/20",
      indigo: "from-indigo-500/10 to-indigo-600/10 border-indigo-500/20",
      emerald: "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20",
      orange: "from-orange-500/10 to-orange-600/10 border-orange-500/20",
    };
    return colors[color] || colors.blue;
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Community Forums
          </h1>
          <p className="text-gray-400">
            Connect with students, ask questions, and share knowledge
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search forums by subject or topic..."
              className="w-full pl-12 pr-4 py-4 bg-[#18181b] border border-[#27272a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <FiMessageSquare className="text-2xl text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Discussions</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalThreads}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <FiUsers className="text-2xl text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-white">
                  {stats.totalMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#18181b] p-6 rounded-xl border border-[#27272a]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <FiTrendingUp className="text-2xl text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Today</p>
                <p className="text-2xl font-bold text-white">
                  {stats.activeToday}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForums.map((forum) => (
            <Link
              key={forum._id}
              to={`/community/forum/${forum._id}`}
              className="block"
            >
              <div
                className={`bg-gradient-to-br ${getColorClasses(
                  forum.color
                )} p-6 rounded-xl border hover:scale-[1.02] transition-all shadow-lg`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{forum.icon}</div>
                  <FiChevronRight className="text-gray-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {forum.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {forum.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <FiMessageSquare size={14} />
                    <span>{forum.threads} threads</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <FiUsers size={14} />
                    <span>{forum.members}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Forum Threads Component
export const ForumThreads = () => {
  const { forumId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem("token");
  const [forum, setForum] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("recent");
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [newThread, setNewThread] = useState({
    title: "",
    content: "",
    tags: "",
  });

  useEffect(() => {
    fetchThreads();
  }, [forumId, sortBy]);

  const fetchThreads = async () => {
    try {
      const [threadsRes, forumRes] = await Promise.all([
        forumAPI.getThreads(forumId, { sortBy }),
        axios.get(`${API_BASE_URL}/forum/${forumId}`),
      ]);

      setThreads(threadsRes.data.data.threads);
      setForum(forumRes.data.data.forum);
    } catch (error) {
      toast.error("Failed to load threads");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThread.title || !newThread.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const tags = newThread.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await forumAPI.createThread(
        forumId,
        {
          title: newThread.title,
          content: newThread.content,
          tags,
        },
        token
      );

      toast.success("Thread created successfully!");
      setShowCreateThread(false);
      setNewThread({ title: "", content: "", tags: "" });
      fetchThreads();
    } catch (error) {
      toast.error("Failed to create thread");
      console.error(error);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
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
        <div className="mb-6">
          <button
            onClick={() => navigate("/community")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <FiArrowLeft /> Back to Forums
          </button>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {forum?.name} {forum?.icon}
              </h1>
              <p className="text-gray-400">{forum?.description}</p>
            </div>
            <button
              onClick={() =>
                isAuthenticated ? setShowCreateThread(true) : navigate("/login")
              }
              className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              <FiEdit2 /> New Thread
            </button>
          </div>
        </div>

        {showCreateThread && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#18181b] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Create New Thread</h2>
              <form onSubmit={handleCreateThread} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newThread.title}
                    onChange={(e) =>
                      setNewThread({ ...newThread, title: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-white"
                    placeholder="Enter thread title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Content
                  </label>
                  <textarea
                    value={newThread.content}
                    onChange={(e) =>
                      setNewThread({ ...newThread, content: e.target.value })
                    }
                    rows="6"
                    className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-white"
                    placeholder="What would you like to discuss?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newThread.tags}
                    onChange={(e) =>
                      setNewThread({ ...newThread, tags: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#27272a] border border-[#3f3f46] rounded-lg text-white"
                    placeholder="e.g. Calculus, Integration, Help"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Create Thread
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateThread(false)}
                    className="px-6 py-2 bg-[#27272a] text-white rounded-lg hover:bg-[#3f3f46]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          {["recent", "popular", "unanswered"].map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                sortBy === sort
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "bg-[#18181b] text-gray-400 border border-[#27272a] hover:bg-[#27272a]"
              }`}
            >
              {sort}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              to={`/community/thread/${thread.id}`}
              className="block bg-[#18181b] p-6 rounded-xl border border-[#27272a] hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {thread.isPinned && (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-semibold rounded border border-yellow-500/20">
                        PINNED
                      </span>
                    )}
                    <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                      {thread.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <FiUser size={14} />
                      <span>{thread.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock size={14} />
                      <span>{getTimeAgo(thread.lastActivity)}</span>
                    </div>
                  </div>

                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {thread.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#27272a] text-gray-300 text-xs rounded-lg border border-[#3f3f46]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 text-sm">
                  <div className="flex items-center gap-1 text-purple-400">
                    <FiMessageSquare size={16} />
                    <span className="font-semibold">{thread.replies}</span>
                  </div>
                  <div className="text-gray-400">{thread.views} views</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

// Thread Detail Component
export const ThreadDetail = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem("token");
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  const fetchThread = async () => {
    try {
      const response = await forumAPI.getThread(threadId);
      setThread(response.data.data.thread);
    } catch (error) {
      toast.error("Failed to load thread");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      await forumAPI.addReply(threadId, { content: replyText }, token);
      toast.success("Reply posted!");
      setReplyText("");
      fetchThread();
    } catch (error) {
      toast.error("Failed to post reply");
      console.error(error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await forumAPI.likeThread(threadId, token);
      fetchThread();
    } catch (error) {
      toast.error("Failed to like thread");
      console.error(error);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <FiArrowLeft /> Back
        </button>

        <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {thread.title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {thread.author.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold">{thread.author.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(thread.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <FiStar size={14} />
              <span>{thread.author.reputation} rep</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-4">
            <p className="text-gray-300 leading-relaxed">{thread.content}</p>
          </div>

          {thread.tags && thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {thread.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-lg border border-purple-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-400 pt-4 border-t border-[#27272a]">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 hover:text-purple-400 transition-colors"
            >
              <FiThumbsUp /> <span>{thread.likes} Likes</span>
            </button>
            <span>{thread.views} Views</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {thread.replies.length} Replies
          </h2>

          <div className="space-y-4">
            {thread.replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-[#18181b] rounded-xl border border-[#27272a] p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">
                      {reply.author.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold">
                        {reply.author.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {reply.content}
                    </p>
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 mt-2 transition-colors">
                      <FiThumbsUp size={12} /> {reply.likes}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#18181b] rounded-xl border border-[#27272a] p-6">
          <h3 className="text-lg font-bold text-white mb-4">Post a Reply</h3>
          {isAuthenticated ? (
            <div className="space-y-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Share your thoughts..."
                rows="4"
                className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleReply}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <FiSend /> Post Reply
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                Please login to reply to this thread
              </p>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all"
              >
                Login to Reply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForumsList;
