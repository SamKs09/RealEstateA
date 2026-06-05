// Root layout required by Next.js App Router.
// Actual HTML structure (html, body, fonts) is in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children as React.ReactElement;
}
