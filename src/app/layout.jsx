import "@/styles/globals.css";
import { ThemeProvider } from "@/context/theme-provider";
import { AuthProvider } from "@/context/auth-provider";
import { PromptProvider } from "@/context/prompt-context";
import { KeywordPromptProvider } from "@/context/keyword-prompt-context";
import { CompetitorPromptProvider } from "@/context/competitor-prompt-count";
import { ChatPromptProvider } from "@/context/chat-prompt-context";
import ConditionalNavbar from "@/components/navbar/ConditionalNavbar";

export const metadata = {
  title: "Luzu AI",
  openGraph: {
    type: "website",
    url: "https://app.luzu.ai",
    title: "Luzu AI",
  },
};

export default function Layout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <AuthProvider>
          <PromptProvider>
            <KeywordPromptProvider>
              <CompetitorPromptProvider>
                <ChatPromptProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <ConditionalNavbar />
                    {children}
                  </ThemeProvider>
                </ChatPromptProvider>
              </CompetitorPromptProvider>
            </KeywordPromptProvider>
          </PromptProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
