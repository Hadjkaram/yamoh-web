import type { Metadata } from "next";
import { Lexend } from "next/font/google"; // 1. On importe la police de BlaBlaCar
import "./globals.css";

// 2. On configure la police Lexend
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "Yamoh | Covoiturage à Abidjan", // 3. On met un vrai titre pour Google
  description: "On fait la route ensemble à Abidjan. Payez par Mobile Money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr" // 4. On indique à Google que le site est en français
      className={`${lexend.variable} h-full antialiased`}
    >
      {/* 5. On applique la police à tout le corps (body) du site */}
      <body className={`${lexend.className} min-h-full flex flex-col bg-white`}>
        {children}
      </body>
    </html>
  );
}