import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { marketplaceAPI, purchaseAPI, reviewAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
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
  FiImage,
  FiArrowLeft,
} from "react-icons/fi";

const NoteViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, hasActiveSubscription, refreshUser } =
    useAuth();

  const [note, setNote] = useState(null);
  const [pages, setPages] = useState([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // AI Features state
  const [aiLoading, setAILoading] = useState(false);
  const [aiResult, setAIResult] = useState(null);
  const [activeTab, setActiveTab] = useState("page");

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Review state
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  useEffect(() => {
    fetchNote();

    // Anti-piracy measures
    const preventContextMenu = (e) => e.preventDefault();
    const preventScreenshot = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s")) {
        e.preventDefault();
        toast.error("Screenshots are disabled for content protection");
      }
    };

    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", preventScreenshot);

    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventScreenshot);
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
      toast.error("Failed to load note");
      navigate("/marketplace");
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
      toast.info("Please login to view this note");
      navigate("/login", { state: { from: `/notes/${id}` } });
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
      toast.info("Please login to purchase");
      navigate("/login", { state: { from: `/notes/${id}` } });
      return;
    }

    setPurchasing(true);
    try {
      await purchaseAPI.purchaseNote(id);
      toast.success(
        note?.isFree
          ? "Note added to your library!"
          : "Note purchased successfully!"
      );
      await fetchNote();
      if (refreshUser) await refreshUser();
      setShowPaymentModal(false);
    } catch (error) {
      const message = error.response?.data?.message || "Purchase failed";
      if (message.includes("Insufficient")) {
        toast.error("Insufficient wallet balance. Please top up your wallet.");
        navigate("/wallet");
      } else {
        toast.error(message);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/notes/${id}` } });
      return;
    }

    setPurchasing(true);
    try {
      await purchaseAPI.purchaseSubscription();
      toast.success(
        "PLUS subscription activated! Enjoy AI features on all notes."
      );
      if (refreshUser) await refreshUser();
      setShowSubscriptionModal(false);
    } catch (error) {
      const message = error.response?.data?.message || "Subscription failed";
      if (message.includes("Insufficient")) {
        toast.error("Insufficient wallet balance. Please top up your wallet.");
        navigate("/wallet");
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
    setActiveTab("page");
    try {
      const response = await marketplaceAPI.generateSummary(id, {
        pageNumber: currentPage + 1,
      });
      setAIResult({ type: "summary", data: response.data.data.summary });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate summary"
      );
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
    setActiveTab("brief");
    try {
      const response = await marketplaceAPI.generateBriefSummary(id);
      setAIResult({ type: "brief", data: response.data.data.summary });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate summary"
      );
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
    setActiveTab("quiz");
    try {
      const response = await marketplaceAPI.generateQuiz(id, {
        numberOfQuestions: 5,
      });
      setAIResult({ type: "quiz", data: response.data.data.quiz });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate quiz");
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
    setActiveTab("cards");
    try {
      const response = await marketplaceAPI.generateFlashcards(id, {
        numberOfCards: 5,
      });
      setAIResult({ type: "flashcards", data: response.data.data.flashcards });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate flashcards"
      );
    } finally {
      setAILoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }
    try {
      await reviewAPI.create(id, { rating, comment: review });
      toast.success("Review submitted!");
      setRating(0);
      setReview("");
      await fetchNote();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-[#0a0a0a]">
        <p className="text-gray-400 mb-4">Note not found</p>
        <button
          onClick={() => navigate("/marketplace")}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/marketplace")}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiArrowLeft className="text-xl" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{note.title}</h1>
                <p className="text-sm text-gray-400">by {note.creator?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {!hasPurchased && !note.isFree && (
                <button
                  onClick={handleViewNote}
                  disabled={purchasing}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <FiCreditCard />{" "}
                  {purchasing ? "Processing..." : `₹${note.price}`}
                </button>
              )}

              {!hasPurchased && note.isFree && (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <FiUnlock /> {purchasing ? "Adding..." : "Free"}
                </button>
              )}

              {hasPurchased && (
                <div className="flex items-center gap-2 text-green-500 font-medium">
                  <FiUnlock className="text-xl" />
                  <span>Purchased</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Access Warning */}
            {!canAccessNote() && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <FiLock className="text-yellow-500 text-xl mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">Preview Mode</p>
                    <p className="text-sm text-yellow-400/80">
                      You're viewing a preview. Purchase to unlock full content
                      and AI features.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Page Navigation */}
            {pages.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <FiChevronLeft /> Previous
                  </button>
                  <span className="font-medium text-gray-300">
                    Page {currentPage + 1} of {pages.length}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(pages.length - 1, currentPage + 1)
                      )
                    }
                    disabled={currentPage === pages.length - 1}
                    className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              </div>
            )}

            {/* Page Content */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-8 secure-content">
              {currentPageData ? (
                <div
                  className="prose prose-invert max-w-none"
                  style={{ userSelect: canAccessNote() ? "auto" : "none" }}
                  onCopy={(e) => !canAccessNote() && e.preventDefault()}
                >
                  {/* Images */}
                  {currentPageData.images &&
                    currentPageData.images.length > 0 && (
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentPageData.images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={img}
                              alt={`Page ${currentPage + 1} - Image ${idx + 1}`}
                              className="w-full rounded-lg"
                            />
                            {!canAccessNote() && (
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                <div className="text-center">
                                  <FiLock className="text-4xl text-purple-500 mx-auto mb-2" />
                                  <p className="text-sm text-gray-300">
                                    Purchase to view
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                    {canAccessNote() ? (
                      currentPageData.content
                    ) : (
                      <>
                        <p>{currentPageData.content?.substring(0, 300)}...</p>
                        <div className="mt-8 p-8 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg text-center border border-gray-700">
                          <FiLock className="text-5xl text-purple-500 mx-auto mb-4" />
                          <p className="text-gray-300 font-medium mb-2 text-lg">
                            Content preview limited
                          </p>
                          <p className="text-sm text-gray-400 mb-6">
                            Purchase this note to view the complete content
                          </p>
                          <button
                            onClick={handleViewNote}
                            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            {note.isFree
                              ? "Get Free Access"
                              : `Purchase for ₹${note.price}`}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No content available
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Tools */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FiZap className="text-purple-500" /> AI Assistant
                  </h3>
                  {hasActiveSubscription && (
                    <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full font-medium">
                      PLUS
                    </span>
                  )}
                </div>

                {!canAccessAIFeatures() && (
                  <div className="mb-4 p-3 bg-purple-600/10 rounded-lg border border-purple-600/30">
                    <p className="text-sm text-purple-300">
                      {!isAuthenticated
                        ? "Login to access AI features"
                        : "Subscribe to PLUS or purchase this note to unlock AI features"}
                    </p>
                    {!hasActiveSubscription && isAuthenticated && (
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="mt-2 text-sm text-purple-400 font-medium hover:text-purple-300 transition-colors"
                      >
                        Get PLUS subscription →
                      </button>
                    )}
                  </div>
                )}

                {/* Tab Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab("page")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "page"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Page
                  </button>
                  <button
                    onClick={() => setActiveTab("brief")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "brief"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Brief
                  </button>
                  <button
                    onClick={() => setActiveTab("quiz")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "quiz"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Quiz
                  </button>
                  <button
                    onClick={() => setActiveTab("cards")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "cards"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Cards
                  </button>
                </div>

                {/* Generate Button */}
                <button
                  onClick={
                    activeTab === "page"
                      ? handleGenerateSummary
                      : activeTab === "brief"
                      ? handleGenerateBriefSummary
                      : activeTab === "quiz"
                      ? handleGenerateQuiz
                      : handleGenerateFlashcards
                  }
                  disabled={aiLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all font-medium flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiZap />
                      Generate{" "}
                      {activeTab === "page"
                        ? "Page Summary"
                        : activeTab === "brief"
                        ? "Brief Overview"
                        : activeTab === "quiz"
                        ? "Quiz"
                        : "Flashcards"}
                    </>
                  )}
                </button>
              </div>

              {/* AI Results */}
              {aiResult && !aiLoading && (
                <div className="p-6 max-h-96 overflow-y-auto bg-[#0f0f0f]">
                  <h4 className="font-medium mb-3 capitalize text-purple-400">
                    {aiResult.type}
                  </h4>
                  {aiResult.type === "summary" || aiResult.type === "brief" ? (
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {aiResult.data}
                    </p>
                  ) : aiResult.type === "quiz" ? (
                    <div className="space-y-4">
                      {Array.isArray(aiResult.data) ? (
                        aiResult.data.map((q, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                          >
                            <p className="font-medium text-sm mb-3 text-gray-200">
                              {idx + 1}. {q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options?.map((opt, optIdx) => (
                                <p
                                  key={optIdx}
                                  className={`text-xs px-3 py-2 rounded ${
                                    optIdx === q.correctAnswer
                                      ? "bg-green-900/30 text-green-400 font-medium border border-green-800"
                                      : "text-gray-400 bg-gray-900/30"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </p>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="text-xs text-gray-500 mt-3 italic">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No quiz data available
                        </p>
                      )}
                    </div>
                  ) : aiResult.type === "flashcards" ? (
                    <div className="space-y-3">
                      {Array.isArray(aiResult.data) ? (
                        aiResult.data.map((card, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                          >
                            <p className="font-medium text-sm text-purple-400 mb-2">
                              {card.front}
                            </p>
                            <p className="text-xs text-gray-400">{card.back}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No flashcard data available
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-bold mb-4">About the Creator</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {note.creator?.name?.charAt(0) || "?"}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-200">
                    {note.creator?.name}
                  </p>
                  {note.creator?.education && (
                    <p className="text-sm text-gray-500">
                      {note.creator.education}
                    </p>
                  )}
                </div>
              </div>
              {note.creator?.bio && (
                <p className="text-sm text-gray-400 mb-3">{note.creator.bio}</p>
              )}
              {note.creator?.subjects && note.creator.subjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.creator.subjects.map((subject, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full border border-purple-600/30"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rating</span>
                  <div className="flex items-center gap-1">
                    <FiStar className="text-yellow-500 fill-current" />
                    <span className="text-gray-200 font-medium">
                      {note.rating?.average?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-gray-500">
                      ({note.rating?.count || 0})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Purchases</span>
                  <span className="text-gray-200 font-medium">
                    {note.purchases || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Pages</span>
                  <span className="text-gray-200 font-medium">
                    {note.totalPages || pages.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Form (only for purchased) */}
            {hasPurchased && (
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-bold mb-4">Leave a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Rating
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-3xl transition-colors ${
                            star <= rating
                              ? "text-yellow-500"
                              : "text-gray-700 hover:text-yellow-400"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Comment (optional)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200 placeholder-gray-600"
                      rows="3"
                      placeholder="Share your thoughts about this note..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Purchase Note</h2>
            <div className="mb-6">
              <p className="text-gray-300 mb-2">{note.title}</p>
              <p className="text-3xl font-bold text-purple-500">
                ₹{note.price}
              </p>
              <p className="text-sm text-gray-400 mt-3">
                Your wallet balance: ₹{user?.walletBalance || 0}
              </p>
              {(user?.walletBalance || 0) < note.price && (
                <p className="text-sm text-red-400 mt-2 flex items-center gap-2">
                  <FiLock className="text-sm" />
                  Insufficient balance. Please top up your wallet.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePurchase}
                disabled={purchasing || (user?.walletBalance || 0) < note.price}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
              >
                {purchasing ? "Processing..." : "Confirm Purchase"}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
              >
                Cancel
              </button>
            </div>
            {(user?.walletBalance || 0) < note.price && (
              <button
                onClick={() => navigate("/wallet")}
                className="w-full mt-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Top Up Wallet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiZap className="text-3xl text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Upgrade to PLUS</h2>
              <p className="text-gray-400">
                Get unlimited access to AI features on all notes
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-600/30 rounded-xl p-6 mb-6">
              <p className="text-3xl font-bold text-purple-400 text-center mb-4">
                ₹479/month
              </p>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <FiFileText className="text-purple-400 text-xs" />
                  </div>
                  AI-powered summaries
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <FiList className="text-purple-400 text-xs" />
                  </div>
                  Auto-generated quizzes
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <FiImage className="text-purple-400 text-xs" />
                  </div>
                  Smart flashcards
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <FiCpu className="text-purple-400 text-xs" />
                  </div>
                  Works on all notes
                </li>
              </ul>
              <p className="text-sm text-gray-400 mt-4 text-center">
                Your wallet balance: ₹{user?.walletBalance || 0}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubscribe}
                disabled={purchasing || (user?.walletBalance || 0) < 479}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all font-medium"
              >
                {purchasing ? "Processing..." : "Subscribe Now"}
              </button>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="flex-1 px-6 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
              >
                Maybe Later
              </button>
            </div>
            {(user?.walletBalance || 0) < 479 && (
              <button
                onClick={() => {
                  setShowSubscriptionModal(false);
                  navigate("/wallet");
                }}
                className="w-full mt-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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
