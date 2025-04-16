"use client";
import KeywordGenerationAi from "@/components/keyword-generation-ai/KeywordGenerationAi";
import { usePathname } from "next/navigation";

const ChatPage = () => {
  const pathname = usePathname();
  const chatId = pathname.split("/").pop();

  return <KeywordGenerationAi contentId={chatId} />;
};

export default ChatPage;
