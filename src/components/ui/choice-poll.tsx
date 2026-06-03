"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Check, Vote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/i18n";

interface ChoicePollProps {
  approvalId: string;
  isAdmin?: boolean;
}

// Generate deterministic mock votes based on the approvalId string
function getMockVotes(approvalId: string) {
  let hash = 0;
  for (let i = 0; i < approvalId.length; i++) {
    hash = approvalId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const votesA = Math.abs((hash >> 0) % 3) + 1; // 1 to 3
  const votesB = Math.abs((hash >> 4) % 2) + 1; // 1 to 2
  const votesC = Math.abs((hash >> 8) % 2);     // 0 to 1
  
  const approveCount = Math.abs((hash >> 12) % 3) + 1; // 1 to 3
  const revisionCount = Math.abs((hash >> 16) % 2);    // 0 to 1
  const rejectCount = Math.abs((hash >> 20) % 2);      // 0 to 1

  return {
    choices: {
      a: votesA,
      b: votesB,
      c: votesC,
    },
    tally: {
      approved: approveCount,
      revision: revisionCount,
      rejected: rejectCount,
    }
  };
}

export function ChoicePoll({ approvalId, isAdmin = false }: ChoicePollProps) {
  const { t } = useLang();
  const pollTrans = t.portal.deliverables.poll;
  
  const [selectedChoice, setSelectedChoice] = React.useState<string | null>(null);
  const [hasVoted, setHasVoted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"choices" | "tally">("choices");

  // Load user choice and mock votes
  const mockData = React.useMemo(() => getMockVotes(approvalId), [approvalId]);
  
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`minerva_choice_voted_${approvalId}`);
      if (stored) {
        setSelectedChoice(stored);
        setHasVoted(true);
      }
    }
  }, [approvalId]);

  const handleVote = (choice: string) => {
    if (isAdmin || hasVoted) return;
    localStorage.setItem(`minerva_choice_voted_${approvalId}`, choice);
    setSelectedChoice(choice);
    setHasVoted(true);
  };

  const choiceVotes = { ...mockData.choices };
  if (selectedChoice && selectedChoice in choiceVotes) {
    choiceVotes[selectedChoice as keyof typeof choiceVotes] += 1;
  }
  
  const totalChoiceVotes = choiceVotes.a + choiceVotes.b + choiceVotes.c;
  const pctA = totalChoiceVotes > 0 ? Math.round((choiceVotes.a / totalChoiceVotes) * 100) : 0;
  const pctB = totalChoiceVotes > 0 ? Math.round((choiceVotes.b / totalChoiceVotes) * 100) : 0;
  const pctC = totalChoiceVotes > 0 ? Math.round((choiceVotes.c / totalChoiceVotes) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-midnight p-5 space-y-4">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Vote className="h-4 w-4 text-[#7FA38A]" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F5F1E8]">
            {pollTrans.title}
          </h4>
        </div>
        <div className="flex bg-obsidian p-0.5 rounded-lg border border-white/5">
          <button
            onClick={() => setActiveTab("choices")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer",
                activeTab === "choices" ? "bg-dusk text-[#F5F1E8]" : "text-[#8A9099] hover:text-[#B8BDC7]"
              )}
          >
            {isAdmin ? "Options Tally" : "Vote"}
          </button>
          <button
            onClick={() => setActiveTab("tally")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer",
                activeTab === "tally" ? "bg-dusk text-[#F5F1E8]" : "text-[#8A9099] hover:text-[#B8BDC7]"
              )}
          >
            Committee
          </button>
        </div>
      </div>

      {activeTab === "choices" ? (
        <div className="space-y-3">
          <p className="text-xs text-[#B8BDC7] font-medium mb-1">{pollTrans.question}</p>
          
          <div className="space-y-2.5">
            {/* Option A */}
            <div 
              onClick={() => handleVote("a")}
              className={cn(
                "relative overflow-hidden rounded-lg border px-4 py-3 transition-all cursor-pointer select-none",
                hasVoted ? "cursor-default" : "hover:border-[#7FA38A]/30 hover:bg-white/[0.01]",
                selectedChoice === "a" ? "border-[#7FA38A] bg-[#7FA38A]/5" : "border-white/5 bg-obsidian/40"
              )}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pctA}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-y-0 left-0 bg-[#7FA38A]/10 pointer-events-none"
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className={cn("text-xs font-medium", selectedChoice === "a" ? "text-[#7FA38A]" : "text-[#B8BDC7]")}>
                  {pollTrans.optionA}
                </span>
                <span className="text-[11px] text-[#8A9099] font-mono">
                  {hasVoted ? `${pctA}% (${choiceVotes.a})` : ""}
                </span>
              </div>
            </div>

            {/* Option B */}
            <div 
              onClick={() => handleVote("b")}
              className={cn(
                "relative overflow-hidden rounded-lg border px-4 py-3 transition-all cursor-pointer select-none",
                hasVoted ? "cursor-default" : "hover:border-[#B89B6A]/30 hover:bg-white/[0.01]",
                selectedChoice === "b" ? "border-[#B89B6A] bg-[#B89B6A]/5" : "border-white/5 bg-obsidian/40"
              )}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pctB}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-y-0 left-0 bg-[#B89B6A]/10 pointer-events-none"
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className={cn("text-xs font-medium", selectedChoice === "b" ? "text-[#B89B6A]" : "text-[#B8BDC7]")}>
                  {pollTrans.optionB}
                </span>
                <span className="text-[11px] text-[#8A9099] font-mono">
                  {hasVoted ? `${pctB}% (${choiceVotes.b})` : ""}
                </span>
              </div>
            </div>

            {/* Option C */}
            <div 
              onClick={() => handleVote("c")}
              className={cn(
                "relative overflow-hidden rounded-lg border px-4 py-3 transition-all cursor-pointer select-none",
                hasVoted ? "cursor-default" : "hover:border-[#B8BDC7]/30 hover:bg-white/[0.01]",
                selectedChoice === "c" ? "border-[#B8BDC7] bg-[#B8BDC7]/5" : "border-white/5 bg-obsidian/40"
              )}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pctC}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-y-0 left-0 bg-white/5 pointer-events-none"
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className={cn("text-xs font-medium", selectedChoice === "c" ? "text-[#F5F1E8]" : "text-[#B8BDC7]")}>
                  {pollTrans.optionC}
                </span>
                <span className="text-[11px] text-[#8A9099] font-mono">
                  {hasVoted ? `${pctC}% (${choiceVotes.c})` : ""}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[10px] text-[#8A9099] mt-2 px-1">
            <span>{hasVoted ? pollTrans.votedSuccessfully : "Select an option to cast your vote."}</span>
            <span>{totalChoiceVotes} {pollTrans.voteCount.replace("{{count}}", String(totalChoiceVotes))}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-[#B8BDC7] font-medium">{pollTrans.committeeTally}</p>
            <p className="text-[10px] text-[#8A9099]">{pollTrans.committeeTallyDesc}</p>
          </div>
          <VoteTally approvalId={approvalId} isAdmin={isAdmin} />
        </div>
      )}
    </div>
  );
}

interface VoteTallyProps {
  approvalId: string;
  isAdmin?: boolean;
}

export function VoteTally({ approvalId, isAdmin = false }: VoteTallyProps) {
  const { t } = useLang();
  const pollTrans = t.portal.deliverables.poll;
  
  const [userTallyVote, setUserTallyVote] = React.useState<string | null>(null);
  
  const mockData = React.useMemo(() => getMockVotes(approvalId), [approvalId]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`minerva_tally_voted_${approvalId}`);
      if (stored) {
        setUserTallyVote(stored);
      }
    }
  }, [approvalId]);

  const handleTallyVote = (vote: string) => {
    if (isAdmin) return;
    if (userTallyVote === vote) {
      localStorage.removeItem(`minerva_tally_voted_${approvalId}`);
      setUserTallyVote(null);
    } else {
      localStorage.setItem(`minerva_tally_voted_${approvalId}`, vote);
      setUserTallyVote(vote);
    }
  };

  const tally = { ...mockData.tally };
  if (userTallyVote) {
    tally[userTallyVote as keyof typeof tally] += 1;
  }

  const totalVotes = tally.approved + tally.revision + tally.rejected;
  const pctApprove = totalVotes > 0 ? Math.round((tally.approved / totalVotes) * 100) : 0;
  const pctRevision = totalVotes > 0 ? Math.round((tally.revision / totalVotes) * 100) : 0;
  const pctReject = totalVotes > 0 ? Math.round((tally.rejected / totalVotes) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Bars Chart */}
      <div className="space-y-3 bg-obsidian/40 p-4 rounded-lg border border-white/5">
        {/* Approved Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#7FA38A] font-medium">
              <Check className="h-3 w-3" /> Approve
            </span>
            <span className="text-[#8A9099] font-mono">{pctApprove}% ({tally.approved})</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pctApprove}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-[#7FA38A] rounded-full"
            />
          </div>
        </div>

        {/* Revisions Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#B89B6A] font-medium animate-pulse">
              Revisions
            </span>
            <span className="text-[#8A9099] font-mono">{pctRevision}% ({tally.revision})</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pctRevision}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-[#B89B6A] rounded-full"
            />
          </div>
        </div>

        {/* Rejected Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[#A86A6A] font-medium">
              Reject
            </span>
            <span className="text-[#8A9099] font-mono">{pctReject}% ({tally.rejected})</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pctReject}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-[#A86A6A] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Casting Tally Vote Buttons (Only for clients) */}
      {!isAdmin && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleTallyVote("approved")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-center transition-all duration-200 cursor-pointer select-none",
              userTallyVote === "approved" 
                ? "bg-[#7FA38A]/10 border-[#7FA38A] text-[#7FA38A]" 
                : "border-white/5 bg-obsidian/20 text-[#8A9099] hover:border-white/10 hover:text-[#B8BDC7]"
            )}
          >
            <span className="text-[10px] font-semibold">{pollTrans.voteApprove}</span>
          </button>

          <button
            onClick={() => handleTallyVote("revision")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-center transition-all duration-200 cursor-pointer select-none",
              userTallyVote === "revision" 
                ? "bg-[#B89B6A]/10 border-[#B89B6A] text-[#B89B6A]" 
                : "border-white/5 bg-obsidian/20 text-[#8A9099] hover:border-white/10 hover:text-[#B8BDC7]"
            )}
          >
            <span className="text-[10px] font-semibold">{pollTrans.voteRevision}</span>
          </button>

          <button
            onClick={() => handleTallyVote("rejected")}
            className={cn(
              "flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-center transition-all duration-200 cursor-pointer select-none",
              userTallyVote === "rejected" 
                ? "bg-[#A86A6A]/10 border-[#A86A6A] text-[#A86A6A]" 
                : "border-white/5 bg-obsidian/20 text-[#8A9099] hover:border-white/10 hover:text-[#B8BDC7]"
            )}
          >
            <span className="text-[10px] font-semibold">{pollTrans.voteReject}</span>
          </button>
        </div>
      )}
    </div>
  );
}
