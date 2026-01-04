import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketplaceAPI, purchaseAPI, reviewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FiLock,
  FiUnlock,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiFileText,
  FiList,
  FiCreditCard,
  FiZap,
  FiImage
} from 'react-icons/fi';

const NoteViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, hasActiveSubscription, refreshUser } = useAuth();

  const [note, setNote] = useState(null);
  const [pages, setPages] = useState([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // AI Features state
  const [aiLoading, setAILoading] = useState(false);
  const [aiResult, setAIResult] = useState(null);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Review state
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
      const data = response.data.data;
      setNote(data.note);
      setPages(data.pages || []);
      setHasPurchased(data.hasPurchased);
    } catch (error) {
      toast.error('Failed to load note');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  // Check if user can access the note content
  const canAccessNote = () => {
    if (!note) return false;
    return hasPurchased || note.isFree;
  };

  // Check if user can access AI features
  const canAccessAIFeatures = () => {
    if (!isAuthenticated) return false;
    if (hasActiveSubscription) return true;
    if (hasPurchased) return true;
    if (note?.isFree) return true;
    return false;
  };

  const handleViewNote = () => {
    if (!isAuthenticated) {
      toast.info('Please login to view this note');
      navigate('/login', { state: { from: `/notes/${id}` } });
      return;
    }

    if (note?.isFree) {
      handlePurchase();
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to purchase');
      navigate('/login', { state: { from: `/notes/${id}` } });
      return;
    }

    setPurchasing(true);
    try {
      await purchaseAPI.purchaseNote(id);
      toast.success(note?.isFree ? 'Note added to your library!' : 'Note purchased successfully!');
      await fetchNote();
      if (refreshUser) await refreshUser();
      setShowPaymentModal(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Purchase failed';
      if (message.includes('Insufficient')) {
        toast.error('Insufficient wallet balance. Please top up your wallet.');
        navigate('/wallet');
      } else {
        toast.error(message);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/notes/${id}` } });
      return;
    }

    setPurchasing(true);
    try {
      await purchaseAPI.purchaseSubscription();
      toast.success('PLUS subscription activated! Enjoy AI features on all notes.');
      if (refreshUser) await refreshUser();
      setShowSubscriptionModal(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Subscription failed';
      if (message.includes('Insufficient')) {
        toast.error('Insufficient wallet balance. Please top up your wallet.');
        navigate('/wallet');
      } else {
        toast.error(message);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!canAccessAIFeatures()) {
      setShowSubscriptionModal(true);
      return;
    }

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

  const handleGenerateBriefSummary = async () => {
    if (!canAccessAIFeatures()) {
      setShowSubscriptionModal(true);
      return;
    }

    setAILoading(true);
    try {
      const response = await marketplaceAPI.generateBriefSummary(id);
      setAIResult({ type: 'brief', data: response.data.data.summary });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setAILoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!canAccessAIFeatures()) {
      setShowSubscriptionModal(true);
      return;
    }

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

  const handleGenerateFlashcards = async () => {
    if (!canAccessAIFeatures()) {
      setShowSubscriptionModal(true);
      return;
    }

    setAILoading(true);
    try {
      const response = await marketplaceAPI.generateFlashcards(id, { numberOfCards: 5 });
      setAIResult({ type: 'flashcards', data: response.data.data.flashcards });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate flashcards');
    } finally {
      setAILoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    try {
      await reviewAPI.create(id, { rating, comment: review });
      toast.success('Review submitted!');
      setRating(0);
      setReview('');
      await fetchNote();
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
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-gray-600 mb-4">Note not found</p>
        <button
          onClick={() => navigate('/marketplace')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{note.title}</h1>
            <p className="text-blue-600 font-medium mb-2">{note.subject}</p>
            <p className="text-gray-600 text-sm mb-4">{note.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-500 fill-current" />
                <span>{note.rating?.average?.toFixed(1) || '0.0'} ({note.rating?.count || 0} reviews)</span>
              </div>
              <span>|</span>
              <span>{note.purchases || 0} purchases</span>
              <span>|</span>
              <span>{note.totalPages || pages.length} pages</span>
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {note.tags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-right">
            {note.isFree ? (
              <div className="text-2xl font-bold text-green-600 mb-2">FREE</div>
            ) : (
              <div className="text-2xl font-bold text-blue-600 mb-2">₹{note.price}</div>
            )}

            {!hasPurchased && !note.isFree && (
              <button
                onClick={handleViewNote}
                disabled={purchasing}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiCreditCard /> {purchasing ? 'Processing...' : 'Purchase Now'}
              </button>
            )}

            {!hasPurchased && note.isFree && (
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiUnlock /> {purchasing ? 'Adding...' : 'Add to Library'}
              </button>
            )}

            {hasPurchased && (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <FiUnlock className="text-xl" />
                <span>Purchased</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Access Warning */}
          {!canAccessNote() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <FiLock className="text-yellow-600 text-xl mt-0.5" />
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
          {pages.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FiChevronLeft /> Previous
                </button>
                <span className="font-medium text-gray-700">
                  Page {currentPage + 1} of {pages.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                  disabled={currentPage === pages.length - 1}
                  className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className="bg-white rounded-lg shadow-md p-6 secure-content">
            {currentPageData ? (
              <div
                className="prose max-w-none"
                style={{ userSelect: canAccessNote() ? 'auto' : 'none' }}
                onCopy={(e) => !canAccessNote() && e.preventDefault()}
              >
                {/* Images */}
                {currentPageData.images && currentPageData.images.length > 0 && (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPageData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Page ${currentPage + 1} - Image ${idx + 1}`}
                          className="w-full rounded-lg shadow-sm"
                        />
                        {!canAccessNote() && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <div className="text-center text-white">
                              <FiLock className="text-4xl mx-auto mb-2" />
                              <p className="text-sm">Purchase to view</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Content */}
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {canAccessNote() ? (
                    currentPageData.content
                  ) : (
                    <>
                      <p>{currentPageData.content?.substring(0, 300)}...</p>
                      <div className="mt-6 p-6 bg-gray-50 rounded-lg text-center">
                        <FiLock className="text-4xl text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium mb-2">Content preview limited</p>
                        <p className="text-sm text-gray-500 mb-4">Purchase this note to view the complete content</p>
                        <button
                          onClick={handleViewNote}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          {note.isFree ? 'Get Free Access' : `Purchase for ₹${note.price}`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No content available</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Tools */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FiCpu className="text-purple-600" /> AI Tools
              </h3>
              {hasActiveSubscription && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                  <FiZap /> PLUS
                </span>
              )}
            </div>

            {!canAccessAIFeatures() && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  {!isAuthenticated
                    ? 'Login to access AI features'
                    : 'Subscribe to PLUS or purchase this note to unlock AI features'}
                </p>
                {!hasActiveSubscription && isAuthenticated && (
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="mt-2 text-sm text-purple-600 font-medium hover:underline"
                  >
                    Get PLUS subscription →
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleGenerateSummary}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiFileText /> Generate Page Summary
              </button>
              <button
                onClick={handleGenerateBriefSummary}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiList /> Brief Overview
              </button>
              <button
                onClick={handleGenerateQuiz}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiList /> Generate Quiz
              </button>
              <button
                onClick={handleGenerateFlashcards}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiImage /> Generate Flashcards
              </button>
            </div>

            {/* AI Results */}
            {aiLoading && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Generating AI content...</p>
              </div>
            )}

            {aiResult && !aiLoading && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md max-h-96 overflow-y-auto">
                <h4 className="font-medium mb-2 capitalize">{aiResult.type}</h4>
                {aiResult.type === 'summary' || aiResult.type === 'brief' ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiResult.data}</p>
                ) : aiResult.type === 'quiz' ? (
                  <div className="space-y-4">
                    {Array.isArray(aiResult.data) ? aiResult.data.map((q, idx) => (
                      <div key={idx} className="p-3 bg-white rounded border">
                        <p className="font-medium text-sm mb-2">{idx + 1}. {q.question}</p>
                        <div className="space-y-1">
                          {q.options?.map((opt, optIdx) => (
                            <p key={optIdx} className={`text-xs ${optIdx === q.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </p>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-xs text-gray-500 mt-2 italic">{q.explanation}</p>
                        )}
                      </div>
                    )) : <p className="text-sm text-gray-500">No quiz data available</p>}
                  </div>
                ) : aiResult.type === 'flashcards' ? (
                  <div className="space-y-2">
                    {Array.isArray(aiResult.data) ? aiResult.data.map((card, idx) => (
                      <div key={idx} className="p-3 bg-white rounded border">
                        <p className="font-medium text-sm">{card.front}</p>
                        <p className="text-xs text-gray-600 mt-1">{card.back}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500">No flashcard data available</p>}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Creator Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">About the Creator</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-gray-500">
                  {note.creator?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-medium">{note.creator?.name}</p>
                {note.creator?.education && (
                  <p className="text-sm text-gray-500">{note.creator.education}</p>
                )}
              </div>
            </div>
            {note.creator?.bio && (
              <p className="text-sm text-gray-600 mb-3">{note.creator.bio}</p>
            )}
            {note.creator?.subjects && note.creator.subjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {note.creator.subjects.map((subject, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {subject}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Review Form (only for purchased) */}
          {hasPurchased && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Leave a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Share your thoughts about this note..."
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
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Purchase Note</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">{note.title}</p>
              <p className="text-2xl font-bold text-blue-600">₹{note.price}</p>
              <p className="text-sm text-gray-500 mt-2">
                Your wallet balance: ₹{user?.walletBalance || 0}
              </p>
              {(user?.walletBalance || 0) < note.price && (
                <p className="text-sm text-red-500 mt-1">
                  Insufficient balance. Please top up your wallet.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePurchase}
                disabled={purchasing || (user?.walletBalance || 0) < note.price}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {purchasing ? 'Processing...' : 'Confirm Purchase'}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            {(user?.walletBalance || 0) < note.price && (
              <button
                onClick={() => navigate('/wallet')}
                className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Top Up Wallet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiZap className="text-3xl text-purple-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Upgrade to PLUS</h2>
              <p className="text-gray-600">Get unlimited access to AI features on all notes</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-2xl font-bold text-purple-600 text-center">₹479/month</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <FiFileText className="text-purple-600" /> AI-powered summaries
                </li>
                <li className="flex items-center gap-2">
                  <FiList className="text-purple-600" /> Auto-generated quizzes
                </li>
                <li className="flex items-center gap-2">
                  <FiImage className="text-purple-600" /> Smart flashcards
                </li>
                <li className="flex items-center gap-2">
                  <FiCpu className="text-purple-600" /> Works on all notes
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Your wallet balance: ₹{user?.walletBalance || 0}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubscribe}
                disabled={purchasing || (user?.walletBalance || 0) < 479}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {purchasing ? 'Processing...' : 'Subscribe Now'}
              </button>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Maybe Later
              </button>
            </div>
            {(user?.walletBalance || 0) < 479 && (
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  navigate('/wallet');
                }}
                className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Top Up Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteViewer;
