import PrfecAi from "@/components/prfec-chat-ai/PrfecAi";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { isAuthenticated } = getKindeServerSession();

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/api/auth/login");
    return null;
  }

  return <PrfecAi chatId={undefined} />;
}
