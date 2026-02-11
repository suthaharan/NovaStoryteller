import PageMetaData from '@/components/PageTitle';
import PlaylistsList from './components/PlaylistsList';

const PlaylistsPage = () => {
  return (
    <>
      <PageMetaData title="Playlists" />
      <PlaylistsList />
    </>
  );
};

export default PlaylistsPage;

