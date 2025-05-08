import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Organize Now - Personal Planner',
  description: 'A Trello-like personal planning website to organize your tasks and projects with lists and cards.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className='antialiased font-sans'>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
