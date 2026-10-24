import { useEffect, useState } from 'react';
import SongListPage from './pages/SongListPage';
import AddSongPage from './pages/AddSongPage';
import SongViewPage from './pages/SongViewPage';

type Route = { name: 'list' } | { name: 'add' } | { name: 'song'; id: string };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  if (clean === 'add') return { name: 'add' };

  const songMatch = clean.match(/^song\/(.+)$/);
  if (songMatch) return { name: 'song', id: decodeURIComponent(songMatch[1]) };

  return { name: 'list' };
}

function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route.name === 'add') return <AddSongPage />;
  if (route.name === 'song') return <SongViewPage songId={route.id} />;
  return <SongListPage />;
}

export default App;
