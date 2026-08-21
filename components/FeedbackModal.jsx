"use client";

import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Brain,
  CheckCircle2,
  AlertCircle,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { StarsBackgroundDemo } from "./StarBackground";
import { RATING_CONFIG } from "../lib/data";
import { GrayTitle } from "./reusable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";

export function FeedbackModal({
  open,
  onOpenChange,
  feedback,
  intervieweeName,
}) {
  if (!feedback) return null;

  const rating = RATING_CONFIG[feedback.overallRating];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border border-amber-200/20 text-stone-100 sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <StarsBackgroundDemo />

        <DialogHeader className="relative">
          <DialogTitle className="font-serif text-2xl tracking-tight">
            <GrayTitle>AI Feedback Report</GrayTitle>
          </DialogTitle>

          {intervieweeName && (
            <p className="text-xs text-stone-500 font-light mt-1">
              Performance analysis for {intervieweeName}
            </p>
          )}
        </DialogHeader>

        <div className="relative flex flex-col gap-5 mt-2">
          {/* Rating */}
          <div
            className={`rounded-2xl border ${rating.className} bg-linear-to-br ${rating.bg} to-transparent p-6 flex items-center justify-between`}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-60">
                Overall rating
              </p>
              <p className="font-serif text-3xl">{rating.label}</p>
            </div>

            <span className="text-4xl">{rating.emoji}</span>
          </div>

          {/* Summary */}
          <div className="bg-[#141417] border border-white/8 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-amber-400" />
              <p className="text-[10px] uppercase tracking-widest text-stone-500">
                Summary
              </p>
            </div>
            <p className="text-sm text-stone-300">{feedback.summary}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-[#141417] border border-white/8 rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">
              Recommendation
            </p>
            <p className="text-sm text-stone-300">{feedback.recommendation}</p>
          </div>

          {/* Sections */}
          <div className="grid gap-3">
            {[
              {
                icon: <Brain size={14} className="text-amber-400" />,
                label: "Technical",
                value: feedback.technical,
              },
              {
                icon: <MessageSquare size={14} className="text-amber-400" />,
                label: "Communication",
                value: feedback.communication,
              },
              {
                icon: <TrendingUp size={14} className="text-amber-400" />,
                label: "Problem Solving",
                value: feedback.problemSolving,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-[#141417] border border-white/8 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  {item.icon}
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">
                    {item.label}
                  </p>
                </div>
                <p className="text-sm text-stone-300">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Strengths & Improvements */}
          {/*<div className="grid grid-cols-2 gap-3">*/}
          {/*  <div className="bg-[#141417] border border-white/8 rounded-xl p-5">*/}

          {/*  </div>*/}

          {/*  <div className="bg-[#141417] border border-white/8 rounded-xl p-5">*/}
          {/*    <div className="flex items-center gap-2 mb-3">*/}
          {/*      <AlertCircle size={13} className="text-amber-400" />*/}
          {/*      <p className="text-[10px] uppercase tracking-widest text-stone-500">*/}
          {/*        To improve*/}
          {/*      </p>*/}
          {/*    </div>*/}

          {/*    <div className="flex flex-col gap-2">*/}
          {/*      {feedback.improvements?.map((imp, i) => (*/}
          {/*        <Badge*/}
          {/*          key={i}*/}
          {/*          variant="outline"*/}
          {/*          className="justify-start border-red-500/20 text-red-400 whitespace-normal"*/}
          {/*        >*/}
          {/*          ✓ {imp}*/}
          {/*        </Badge>*/}
          {/*      ))}*/}
          {/*    </div>*/}
          {/*  </div>*/}
          {/*</div>*/}
          <div className={"grid grid-cols-2 gap-3"}>
            <div className="bg-[#141417]/90 border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center gap-2 pb-1 border-b border-amber-500/10">
                <Target size={16} className="text-green-400" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-green-400">
                  Strengths
                </p>
                {feedback.strengths?.length > 0 && (
                  <span className="ml-auto text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono font-medium">
                    {feedback.strengths.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {feedback.strengths?.map((s, i) => (
                  <div
                    key={i}
                    className="group bg-green-950/20 hover:bg-green-950/35 border border-green-500/15 hover:border-green-500/30 rounded-xl p-3.5 transition-all duration-200 flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center shrink-0 mt-0.5 text-green-400 group-hover:scale-110 transition-transform">
                      <ArrowUpRight size={13} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs text-stone-200 leading-relaxed font-medium">
                      {s}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#141417]/90 border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center gap-2 pb-1 border-b border-amber-500/10">
                <Target size={16} className="text-amber-400" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                  Areas for Growth
                </p>
                {feedback.improvements?.length > 0 && (
                  <span className="ml-auto text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono font-medium">
                    {feedback.improvements.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                {feedback.improvements?.map((imp, i) => (
                  <div
                    key={i}
                    className="group bg-amber-950/20 hover:bg-amber-950/35 border border-amber-500/15 hover:border-amber-500/30 rounded-xl p-3.5 transition-all duration-200 flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-400 group-hover:scale-110 transition-transform">
                      <ArrowUpRight size={13} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs text-stone-200 leading-relaxed font-medium">
                      {imp}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
