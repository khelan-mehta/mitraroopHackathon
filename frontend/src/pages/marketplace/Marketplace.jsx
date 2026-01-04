import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { marketplaceAPI } from '../../services/api';
import { FiSearch, FiFilter, FiStar } from 'react-icons/fi';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notes Marketplace</h1>
        <p className="text-gray-600">Discover and purchase high-quality study notes</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  placeholder="Search notes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              placeholder="Min Price"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />

            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              placeholder="Max Price"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />

            <select
              value={filters.isFree}
              onChange={(e) => setFilters({ ...filters, isFree: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="true">Free Only</option>
              <option value="false">Paid Only</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            >
              <option value="">Sort By</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </form>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No notes found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <Link
              key={note._id}
              to={`/notes/${note._id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {note.title}
                  </h3>
                  {note.isFree ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      FREE
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      ₹{note.price}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">{note.subject}</p>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{note.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <FiStar className="fill-current" />
                    <span className="text-gray-700">
                      {note.rating.average.toFixed(1)} ({note.rating.count})
                    </span>
                  </div>
                  <div className="text-gray-600">{note.purchases} purchases</div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    By: <span className="font-medium">{note.creator.name}</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
