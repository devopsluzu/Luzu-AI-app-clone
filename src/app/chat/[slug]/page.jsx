"use client";
import PrfecAi from "@/components/prfec-chat-ai/PrfecAi";
import { usePathname } from "next/navigation";

const ChatPage = () => {
  const pathname = usePathname();
  const chatId = pathname.split("/").pop();

  return <PrfecAi chatId={chatId || undefined} />;
};

export default ChatPage;
