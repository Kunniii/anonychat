import { useState, useEffect } from 'react';
import AdminConsole from './AdminConsole.jsx';
import LandingPage from './LandingPage.jsx';
import ChatApp from './components/chat/ChatApp.jsx';
import DonationModal from './components/modals/DonationModal.jsx';

export const AnonyChat = () => {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.replace(/\/+$/, '') || '/';
    }
    return '/';
  });
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.replace(/\/+$/, '') || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path.replace(/\/+$/, '') || '/');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  if (currentPath === '/admin') {
    return <AdminConsole />;
  }

  if (currentPath === '/chats') {
    return <ChatApp onGoHome={() => navigateTo('/')} />;
  }

  return (
    <>
      <LandingPage
        onStartChat={() => navigateTo('/chats')}
        onOpenDonation={() => setIsDonationOpen(true)}
      />
      {isDonationOpen && <DonationModal onClose={() => setIsDonationOpen(false)} />}
    </>
  );
};

export default AnonyChat;
