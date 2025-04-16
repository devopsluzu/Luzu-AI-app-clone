"use client";
import KeywordGenerationAi from "@/components/keyword-generation-ai/KeywordGenerationAi";
import { usePathname } from "next/navigation";

const ChatPage = () => {
  const pathname = usePathname();
  const chatId =
    pathname.split("/").pop() !== "keyword"
      ? pathname.split("/").pop()
      : undefined;

  return <KeywordGenerationAi contentId={chatId} />;
};

export default ChatPage;
