import type { Metadata } from "next";
// import "./globals.css"; // Commented out to isolate the 500 error

export const metadata: Metadata = {
  title: "Admin Portal",
  description: "Platform management and Outfitter verification",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}