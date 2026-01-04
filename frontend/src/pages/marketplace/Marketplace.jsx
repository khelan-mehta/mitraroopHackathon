import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceAPI } from '../../services/api';
import { FiSearch, FiStar, FiFileText, FiUser } from 'react-icons/fi';

const Marketplace = () => {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    subject: '',
    minPrice: '',
    maxPrice: '',
    isFree: '',
    sortBy: ''
  });

  useEffect(() => {
    fetchSubjects();
    fetchNotes();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await marketplaceAPI.getSubjects();
      setSubjects(response.data.data.subjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.subject) params.subject = filters.subject;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.isFree) params.isFree = filters.isFree;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const response = await marketplaceAPI.getNotes(params);
      setNotes(response.data.data.notes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      subject: '',
      minPrice: '',
      maxPrice: '',
      isFree: '',
      sortBy: ''
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Notes Marketplace</h1>
          <p className="text-gray-400">Discover and purchase high-quality study notes</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-800 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-5">
                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <div className="space-y-2">
                    {['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Biology'].map((subject) => (
                      <label key={subject} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.subject === subject}
                          onChange={(e) => setFilters({ ...filters, subject: e.target.checked ? subject : '' })}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                        />
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                          {subject}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.isFree === 'true'}
                        onChange={(e) => setFilters({ ...filters, isFree: e.target.checked ? 'true' : '' })}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        Free
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.isFree === 'false'}
                        onChange={(e) => setFilters({ ...filters, isFree: e.target.checked ? 'false' : '' })}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                      />
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        Paid
                      </span>
                    </label>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Price Range Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    {[
                      { label: 'Under ₹50', max: 50 },
                      { label: '₹50-₹200', min: 50, max: 200 },
                      { label: '₹200+', min: 200 }
                    ].map((range) => (
                      <label key={range.label} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={
                            (range.min === undefined || filters.minPrice == range.min) &&
                            (range.max === undefined || filters.maxPrice == range.max)
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({ 
                                ...filters, 
                                minPrice: range.min || '', 
                                maxPrice: range.max || '' 
                              });
                            } else {
                              setFilters({ ...filters, minPrice: '', maxPrice: '' });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                        />
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search Bar */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-800 p-4 mb-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                    placeholder="Search by subject, topic, or creator..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Sort By</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </form>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-gray-400">
                Showing <span className="text-white font-semibold">{notes.length}</span> notes
              </p>
            </div>

            {/* Notes Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent"></div>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-20">
                <FiFileText className="text-5xl text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No notes found</p>
                <p className="text-gray-500 text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => (
                  <Link
                    key={note._id}
                    to={`/notes/${note._id}`}
                    className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-800 hover:border-purple-500/50 overflow-hidden transition-all hover:shadow-lg hover:shadow-purple-500/10"
                  >
                    {/* Note Icon/Placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center border-b border-gray-800">
                      <FiFileText className="text-6xl text-purple-500/30" />
                    </div>

                    <div className="p-5">
                      {/* Title and Price */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {note.title}
                        </h3>
                        {note.isFree ? (
                          <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-full border border-cyan-500/20 whitespace-nowrap">
                            Free
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/20 whitespace-nowrap">
                            ₹{note.price}
                          </span>
                        )}
                      </div>

                      {/* Subject Tag */}
                      <span className="inline-block px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full mb-3">
                        {note.subject}
                      </span>

                      {/* Description */}
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                        {note.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center gap-1 text-yellow-400">
                          <FiStar className="fill-current" />
                          <span className="text-white font-medium">
                            {note.rating.average.toFixed(1)}
                          </span>
                          <span className="text-gray-500">({note.rating.count})</span>
                        </div>
                        <div className="text-gray-400">{note.purchases} reviews</div>
                      </div>

                      {/* Creator */}
                      <div className="pt-4 border-t border-gray-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {note.creator.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          by <span className="text-gray-300 font-medium">{note.creator.name}</span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;