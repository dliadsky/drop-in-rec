import React, { useState } from 'react';
import { Modal } from './ui/Modal';

interface AppHeaderProps {
  onAboutClick: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onAboutClick }) => {
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleAboutClick = () => {
    setShowAboutModal(true);
    onAboutClick();
  };

  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-4 sm:px-6 py-3">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity hover:text-black dark:hover:text-white">
          <div className="h-8 w-24 text-[#13a4ec] flex-shrink-0">
            <img 
              src="drop-in-rec-logo.svg" 
              alt="Toronto Drop-in Recreation Finder Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="text-lg font-bold leading-tight text-slate-800 dark:text-slate-200">
            <span className="hidden sm:inline">Toronto Drop-in Recreation Finder</span>
            <span className="sm:hidden">
              Toronto Drop-in<br />
              Recreation Finder
            </span>
          </h2>
        </a>
        <button 
          className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          onClick={handleAboutClick}
        >
          <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
            info
          </span>
        </button>
      </header>

      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="About Toronto Drop-in Recreation Finder"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">What is this tool?</h3>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
              The Toronto Drop-in Recreation Finder helps you discover drop-in recreation programs and activities 
              available across the city. Whether you're looking for sports, arts, fitness, or family activities, 
              this tool connects you with programs that match your interests, schedule, and location.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">How to use it</h3>
            <ul className="text-gray-700 dark:text-slate-300 space-y-2">
              <li className="flex items-start">
                <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">search</span>
                <span><strong>Search by category:</strong> Browse programs by type (Sports, Arts, Fitness, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">schedule</span>
                <span><strong>Filter by time:</strong> Find programs that fit your schedule</span>
              </li>
              <li className="flex items-start">
                <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">location_on</span>
                <span><strong>Find nearby locations:</strong> Discover programs in your area</span>
              </li>
              <li className="flex items-start">
                <span className="material-symbols-outlined text-[#13a4ec] mr-2 mt-0.5 text-sm">share</span>
                <span><strong>Share your search:</strong> Save and share your favorite filter combinations</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-200 mb-3">Data source</h3>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed">
              This tool uses <a className="text-[#13a4ec]" href="https://open.toronto.ca/catalogue/?search=recreation&sort=score%20desc" target="_blank">open data</a> from the City of Toronto's drop-in recreation programs and facilities. 
              It does not include data about the City's registered recreation programming such as lessons and classes.
              Data are retrieved nightly to ensure accuracy, but last-minute program changes and availability may not be accuractely reflected here. 
              For the most current information, please contact the specific recreation centre.
            </p>
          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Built with <svg className="inline w-5 h-5 fill-[#13a4ec]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-labelledby="heartTitle">
                      <title id="heartTitle">Heart icon</title>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09 C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5 c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg> by <a className="text-[#13a4ec] hover:text-[#13a4ec]/80" href="https://purposeanalytics.ca" target="_blank">Purpose Analytics</a>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a 
                    href="https://www.linkedin.com/company/purpose-analytics" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 dark:text-slate-400 hover:text-[#0077b5] transition-colors"
                    title="Purpose Analytics LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                </a>
                <a 
                  href="https://github.com/dliadsky/drop-in-rec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                  title="View on GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AppHeader;
