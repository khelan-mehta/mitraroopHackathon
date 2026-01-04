import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash } from 'react-icons/fi';

const CreateNote = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    price: '',
    tags: ''
  });
  const [pages, setPages] = useState([{ pageNumber: 1, content: '', images: [] }]);

  const handleAddPage = () => {
    setPages([...pages, { pageNumber: pages.length + 1, content: '', images: [] }]);
  };

  const handleRemovePage = (index) => {
    if (pages.length === 1) {
      toast.error('You must have at least one page');
      return;
    }
    const newPages = pages.filter((_, i) => i !== index);
    setPages(newPages.map((page, i) => ({ ...page, pageNumber: i + 1 })));
  };

  const handlePageContentChange = (index, content) => {
    const newPages = [...pages];
    newPages[index].content = content;
    setPages(newPages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pages.some((page) => !page.content.trim())) {
      toast.error('All pages must have content');
      return;
    }

    setLoading(true);
    try {
      const tags = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

      const noteData = {
        ...formData,
        price: Number(formData.price),
        pages,
        tags
      };

      await notesAPI.create(noteData);
      toast.success('Note created successfully!');
      navigate('/notemaker');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Note</h1>
        <p className="mt-2 text-gray-600">Share your knowledge with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Introduction to Quantum Physics"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Physics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0 for free, or enter price"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Comprehensive notes covering key concepts..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="quantum, mechanics, advanced"
              />
            </div>
          </div>
        </div>

        {/* Pages */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Note Pages</h2>
            <button
              type="button"
              onClick={handleAddPage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiPlus /> Add Page
            </button>
          </div>

          <div className="space-y-4">
            {pages.map((page, index) => (
              <div key={index} className="border border-gray-300 rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Page {page.pageNumber}</h3>
                  <button
                    type="button"
                    onClick={() => handleRemovePage(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FiTrash />
                  </button>
                </div>
                <textarea
                  value={page.content}
                  onChange={(e) => handlePageContentChange(index, e.target.value)}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter page content..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Creating Note...' : 'Create Note'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/notemaker')}
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Your note will be checked for similarity with existing content. Notes with high
            similarity scores will be sent for admin review.
          </p>
        </div>
      </form>
    </div>
  );
};

export default CreateNote;
