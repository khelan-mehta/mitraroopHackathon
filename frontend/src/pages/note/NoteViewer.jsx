import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { marketplaceAPI, purchaseAPI, reviewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiLock, FiUnlock, FiStar, FiMessageSquare } from 'react-icons/fi';

const NoteViewer = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [note, setNote] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showAITools, setShowAITools] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiResult, setAIResult] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  useEffect(() => {
    fetchNote();

    // Anti-piracy measures
    const preventContextMenu = (e) => e.preventDefault();
    const preventScreenshot = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        toast.error('Screenshots are disabled for content protection');
      }
    };

    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventScreenshot);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventScreenshot);
    };
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await marketplaceAPI.getNote(id);
      setNote(response.data.data.note);
      setHasPurchased(response.data.data.hasPurchased);
    } catch (error) {
      toast.error('Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase');
      return;
    }

    setPurchasing(true);
    try {
      await purchaseAPI.purchaseNote(id);
      toast.success('Note purchased successfully!');
      await fetchNote();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleGenerateSummary = async () => {
    setAILoading(true);
    try {
      const response = await marketplaceAPI.generateSummary(id, {
        pageNumber: currentPage + 1
      });
      setAIResult({ type: 'summary', data: response.data.data.summary });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setAILoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setAILoading(true);
    try {
      const response = await marketplaceAPI.generateQuiz(id, { numberOfQuestions: 5 });
      setAIResult({ type: 'quiz', data: response.data.data.quiz });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate quiz');
    } finally {
      setAILoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await reviewAPI.create(id, { rating, comment: review });
      toast.success('Review submitted!');
      setRating(0);
      setReview('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Note not found</p>
      </div>
    );
  }

  const displayPages = hasPurchased ? note.pages : note.pages;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{note?.note?.title}</h1>
            <p className="text-gray-600 mb-2">{note?.note?.subject}</p>
            <p className="text-sm text-gray-500">{note?.note?.description}</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-500 fill-current" />
                <span>{note?.note?.rating.average.toFixed(1)} ({note?.note?.rating.count} reviews)</span>
              </div>
              <span className="text-gray-500">•</span>
              <span>{note?.note?.purchases} purchases</span>
              <span className="text-gray-500">•</span>
              <span>{note?.note?.totalPages} pages</span>
            </div>
          </div>

          <div className="text-right">
            {note?.note?.isFree ? (
              <div className="text-2xl font-bold text-green-600">FREE</div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">₹{note?.note?.price}</div>
            )}

            {!hasPurchased && !note?.note?.isFree && (
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {purchasing ? 'Processing...' : 'Purchase Now'}
              </button>
            )}

            {hasPurchased && (
              <div className="mt-4 flex items-center gap-2 text-green-600">
                <FiUnlock />
                <span className="font-medium">Purchased</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Content Protection Warning */}
          {!hasPurchased && !note?.note?.isFree && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <FiLock className="text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-yellow-800">Preview Mode</p>
                  <p className="text-sm text-yellow-700">
                    You're viewing a preview. Purchase to unlock full content and AI features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Page Navigation */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-medium">
                Page {currentPage + 1} of {displayPages?.length}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(displayPages.length - 1, currentPage + 1))}
                disabled={currentPage === displayPages?.length - 1}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Page Content - Protected */}
          <div className="bg-white rounded-lg shadow-md p-6 secure-content select-none">
            <div
              className="prose max-w-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              onCopy={(e) => e.preventDefault()}
            >
              {displayPages ? displayPages[currentPage] && (
                <div>
                  <p className="whitespace-pre-wrap">{displayPages[currentPage]?.content}</p>
                  {!hasPurchased && !note?.note?.isFree && (
                    <div className="mt-4 p-4 bg-gray-100 text-center">
                      <p className="text-gray-600">Content preview limited. Purchase to view full page.</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Tools */}
          {hasPurchased && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">AI Tools</h3>
              <div className="space-y-2">
                <button
                  onClick={handleGenerateSummary}
                  disabled={aiLoading}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  Generate Page Summary
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={aiLoading}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Generate Quiz
                </button>
              </div>

              {aiResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">
                    {aiResult.type === 'summary' ? 'Summary' : 'Quiz'}
                  </h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{aiResult.data}</div>
                </div>
              )}
            </div>
          )}

          {/* Submit Review */}
          {hasPurchased && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Leave a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Submit Review
                </button>
              </form>
            </div>
          )}

          {/* Creator Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">About the Creator</h3>
            <p className="font-medium">{note?.note?.creator?.name}</p>
            {note?.note?.creator?.bio && (
              <p className="text-sm text-gray-600 mt-2">{note?.note?.creator?.bio}</p>
            )}
            {note?.note?.creator?.subjects && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {note.note.creator.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteViewer;
