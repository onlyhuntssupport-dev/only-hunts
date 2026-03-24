"use client";

import { useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitMilestoneReview } from "@/app/actions/reviews";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  inquiryId: string;
  outfitterId: string;
  hunterId: string;
  milestoneNumber: 1 | 2 | 3;
  onSuccess: () => void;
}

const MILESTONE_QUESTIONS = {
  1: {
    title: "Rate the Booking Phase",
    description: "You just secured your dates! How was the process?",
    keys: ["communication", "friendliness", "easeOfBooking"],
    labels: ["Outfitter Communication", "Friendliness & Helpfulness", "Ease of Booking/Payment"]
  },
  2: {
    title: "Rate the Safari Experience",
    description: "Welcome back! How was the actual hunt?",
    keys: ["professionalHunter", "lodgeAndFood", "trophyQuality"],
    labels: ["Professional Hunter (PH) Skills", "Lodge & Food Quality", "Quality of Game / Trophies"]
  },
  3: {
    title: "Rate the Taxidermy & Logistics",
    description: "Your trophies have arrived. How was the final stretch?",
    keys: ["taxidermy", "shipping", "finalCommunication"],
    labels: ["Taxidermy Quality/Timeline", "Shipping & Logistics", "Post-Hunt Communication"]
  }
};

export default function MilestoneReviewModal({ isOpen, onClose, inquiryId, outfitterId, hunterId, milestoneNumber, onSuccess }: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const currentMilestone = MILESTONE_QUESTIONS[milestoneNumber];

  const handleStarClick = (key: string, rating: number) => {
    setRatings(prev => ({ ...prev, [key]: rating }));
  };

  const handleSubmit = async () => {
    setError("");
    // Ensure all 3 questions are answered
    if (Object.keys(ratings).length < 3) {
      setError("Please rate all three categories before submitting.");
      return;
    }

    setLoading(true);
    const res = await submitMilestoneReview({
      inquiryId,
      outfitterId,
      hunterId,
      milestoneNumber,
      ratings,
      comment
    });

    setLoading(false);
    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Failed to submit review.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-olive p-6 text-off-white relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
          <div className="inline-block bg-kalahari/20 text-kalahari text-xs font-black px-3 py-1 rounded uppercase tracking-widest mb-3">
            Milestone {milestoneNumber} of 3
          </div>
          <h2 className="text-2xl font-black font-headline tracking-tight">{currentMilestone.title}</h2>
          <p className="text-white/70 font-medium mt-1">{currentMilestone.description}</p>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg font-bold text-sm">{error}</div>}

          <div className="space-y-6">
            {currentMilestone.keys.map((key, index) => (
              <div key={key} className="bg-off-white p-4 rounded-xl border border-kalahari/20">
                <label className="block text-sm font-bold text-olive dark:text-off-white mb-2">{currentMilestone.labels[index]}</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleStarClick(key, star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`h-8 w-8 ${
                          (ratings[key] || 0) >= star 
                            ? "text-kalahari fill-kalahari" 
                            : "text-kalahari/30"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-olive dark:text-off-white mb-2">Additional Comments (Optional)</label>
            <Textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Leave a note about this specific phase of the journey..." 
              className="border-kalahari/30 focus-visible:ring-olive resize-y"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-kalahari/20 bg-off-white flex-shrink-0 flex justify-end">
          <Button onClick={handleSubmit} disabled={loading} className="bg-olive hover:bg-olive/90 text-kalahari font-black h-12 px-8">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Review"}
          </Button>
        </div>

      </div>
    </div>
  );
}