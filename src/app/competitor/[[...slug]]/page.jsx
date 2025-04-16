"use client";
import CompetitorAnalysisAi from "@/components/competitor-analysis-ai/CompetitorAnalysisAi";
import { CompetitorPromptProvider } from "@/context/competitor-prompt-count";
import { usePathname } from "next/navigation";

const ChatPage = () => {
  const pathname = usePathname();
  const chatId =
    pathname.split("/").pop() !== "competitor"
      ? pathname.split("/").pop()
      : undefined;

  return (
    <CompetitorPromptProvider>
      <CompetitorAnalysisAi contentId={chatId || undefined} />
    </CompetitorPromptProvider>
  );
};

export default ChatPage;
