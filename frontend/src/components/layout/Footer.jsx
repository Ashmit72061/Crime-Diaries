import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { APP_NAME } from '../../utils/constants.js';

export const Footer = () => (
  <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-violet-400" />
            <span className="font-bold text-zinc-100">{APP_NAME}</span>
          </Link>
          <p className="text-sm text-zinc-500 max-w-xs">
            Your dark corner of the internet for crime fiction, true crime, and mystery.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors border border-zinc-800">
              GitHub
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors border border-zinc-800">
              X / Twitter
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-3">Explore</h3>
          <ul className="space-y-2">
            {['Stories', 'True Crime', 'Community', 'Authors'].map((item) => (
              <li key={item}>
                <Link to={`/${item.toLowerCase().replace(' ', '-')}`}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-3">Legal</h3>
          <ul className="space-y-2">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <li key={item}>
                <Link to={`/${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </div>
  </footer>
);
