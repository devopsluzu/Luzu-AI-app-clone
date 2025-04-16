"use client";
import PuterChat from "@/components/content-generation-ai/ContentGenAi";
import { usePathname } from "next/navigation";

const ChatPage = () => {
  const pathname = usePathname();
  const chatId =
    pathname.split("/").pop() !== "content-generation"
      ? pathname.split("/").pop()
      : undefined;

  return <PuterChat contentId={chatId || undefined} />;
};

export default ChatPage;
