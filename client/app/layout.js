import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "UniBuss",
  description: "A simple ride booking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/fav.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
