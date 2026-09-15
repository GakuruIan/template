import { Instrument_Sans, JetBrains_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { ReactQueryClientProvider } from "@/providers/ReactQueryProvider"
import { Toaster } from "@workspace/ui/components/sonner"

import { cn } from "@workspace/ui/lib/utils"

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        instrumentSans.variable,
        jetbrainsMono.variable,
        "font-sans"
      )}
    >
      <body>
        <ReactQueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>{children}</ThemeProvider>
            <Toaster richColors />
          </TooltipProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  )
}
