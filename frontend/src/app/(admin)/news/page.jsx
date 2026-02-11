import PageMetaData from '@/components/PageTitle';
import NewsList from './components/NewsList';

const NewsPage = () => {
  return (
    <>
      <PageMetaData title="News Management" />
      <NewsList />
    </>
  );
};

export default NewsPage;


