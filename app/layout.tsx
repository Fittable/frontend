import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Part-time Work Scheduler",
  description: "Schedule and manage part-time work shifts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

