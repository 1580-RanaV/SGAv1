import './globals.css';

export const metadata = {
  title: 'SGAv1.1 : Skills Gap Analyzer',
  description: 'Compare a JD with your resume to find missing skills and improvements.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-neutral-50 text-neutral-900">
      <body>
        <div className="min-h-dvh">{children}</div>
      </body>
    </html>
  );
}
