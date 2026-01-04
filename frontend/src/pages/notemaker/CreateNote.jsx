import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash, FiImage, FiUpload, FiX, FiLoader, FiAlertCircle } from 'react-icons/fi';

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
  const [uploadingImages, setUploadingImages] = useState({});
  const [extractingText, setExtractingText] = useState({});
  const fileInputRefs = useRef({});

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

  const handleImageUpload = async (pageIndex, files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Validate file sizes
    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
    }

    setUploadingImages(prev => ({ ...prev, [pageIndex]: true }));

    try {
      const formData = new FormData();
      fileArray.forEach(file => {
        formData.append('images', file);
      });

      const response = await notesAPI.uploadImages(formData);
      
      if (response.data.success) {
        const uploadedImages = response.data.data.images;
        const newPages = [...pages];
        newPages[pageIndex].images = [
          ...newPages[pageIndex].images,
          ...uploadedImages.map(img => img.url)
        ];
        setPages(newPages);
        toast.success(`${uploadedImages.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploadingImages(prev => ({ ...prev, [pageIndex]: false }));
    }
  };

  const handleRemoveImage = (pageIndex, imageIndex) => {
    const newPages = [...pages];
    newPages[pageIndex].images = newPages[pageIndex].images.filter((_, i) => i !== imageIndex);
    setPages(newPages);
    toast.success('Image removed');
  };

  const handleExtractTextFromImages = async (pageIndex) => {
    const page = pages[pageIndex];
    
    if (!page.images || page.images.length === 0) {
      toast.error('No images to extract text from');
      return;
    }

    setExtractingText(prev => ({ ...prev, [pageIndex]: true }));

    try {
      const response = await notesAPI.analyzeImages(page.images, formData.subject || 'General');
      
      if (response.data.success) {
        const extractedText = response.data.data.extractedText || '';
        const newPages = [...pages];
        
        // Append or replace content
        if (newPages[pageIndex].content.trim()) {
          newPages[pageIndex].content += '\n\n' + extractedText;
        } else {
          newPages[pageIndex].content = extractedText;
        }
        
        setPages(newPages);
        toast.success('Text extracted from images successfully!');
      }
    } catch (error) {
      console.error('Extract text error:', error);
      toast.error(error.response?.data?.message || 'Failed to extract text from images');
    } finally {
      setExtractingText(prev => ({ ...prev, [pageIndex]: false }));
    }
  };

  const triggerFileInput = (pageIndex) => {
    if (fileInputRefs.current[pageIndex]) {
      fileInputRefs.current[pageIndex].click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pages.some((page) => !page.content.trim() && page.images.length === 0)) {
      toast.error('All pages must have content or images');
      return;
    }

    setLoading(true);
    try {
      const tags = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean);

      const noteData = {
        ...formData,
        price: Number(formData.price),
        pages: pages.map(p => ({
          content: p.content,
          images: p.images
        })),
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
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Create New Note</h1>
          <p className="mt-2 text-gray-400">Share your knowledge with the community</p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-[#18181b] rounded-2xl shadow-xl border border-[#27272a] p-6">
            <h2 className="text-xl font-bold mb-6 text-white">Basic Information</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Introduction to Quantum Physics"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Physics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0 for free, or enter price"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Comprehensive notes covering key concepts..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-[#27272a] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="quantum, mechanics, advanced"
                />
              </div>
            </div>
          </div>

          {/* Pages */}
          <div className="bg-[#18181b] rounded-2xl shadow-xl border border-[#27272a] p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Note Pages</h2>
              <button
                type="button"
                onClick={handleAddPage}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold transition-all shadow-lg shadow-purple-500/20"
              >
                <FiPlus /> Add Page
              </button>
            </div>

            <div className="space-y-6">
              {pages.map((page, index) => (
                <div key={index} className="border border-[#27272a] rounded-xl p-5 bg-[#27272a]/30">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg text-white">Page {page.pageNumber}</h3>
                    <button
                      type="button"
                      onClick={() => handleRemovePage(index)}
                      className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                    >
                      <FiTrash size={18} />
                    </button>
                  </div>

                  {/* Image Upload Section */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-sm font-medium text-gray-300">Page Images</label>
                      <span className="text-xs text-gray-500 bg-[#3f3f46] px-2 py-1 rounded">
                        {page.images.length} uploaded
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      <button
                        type="button"
                        onClick={() => triggerFileInput(index)}
                        disabled={uploadingImages[index]}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 text-sm font-semibold transition-all shadow-lg shadow-purple-500/20"
                      >
                        {uploadingImages[index] ? (
                          <>
                            <FiLoader className="animate-spin" /> Uploading...
                          </>
                        ) : (
                          <>
                            <FiUpload /> Upload Images
                          </>
                        )}
                      </button>

                      {page.images.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleExtractTextFromImages(index)}
                          disabled={extractingText[index]}
                          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 text-sm font-semibold transition-all shadow-lg shadow-green-500/20"
                        >
                          {extractingText[index] ? (
                            <>
                              <FiLoader className="animate-spin" /> Extracting...
                            </>
                          ) : (
                            <>
                              <FiImage /> Extract Text from Images
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <input
                      ref={(el) => (fileInputRefs.current[index] = el)}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e.target.files)}
                      className="hidden"
                    />

                    {/* Image Preview Grid */}
                    {page.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {page.images.map((imageUrl, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Page ${page.pageNumber} - Image ${imgIndex + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-[#3f3f46]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index, imgIndex)}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            >
                              <FiX size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Page Content
                    </label>
                    <textarea
                      value={page.content}
                      onChange={(e) => handlePageContentChange(index, e.target.value)}
                      rows="8"
                      className="w-full px-4 py-3 bg-[#18181b] border border-[#3f3f46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Enter page content or extract from images above..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
            >
              {loading ? 'Creating Note...' : 'Create Note'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/notemaker')}
              className="px-6 py-3.5 border border-[#3f3f46] text-gray-300 rounded-xl hover:bg-[#27272a] font-semibold transition-all"
            >
              Cancel
            </button>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 flex items-start gap-3">
            <FiAlertCircle className="text-yellow-400 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-medium mb-1">Important Notice</p>
              <p className="text-sm text-yellow-400/80">
                Your note will be checked for similarity with existing content. Notes with high
                similarity scores will be sent for admin review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNote;