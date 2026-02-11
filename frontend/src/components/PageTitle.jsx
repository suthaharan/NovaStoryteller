import { DEFAULT_PAGE_TITLE } from '@/context/constants';
const PageMetaData = ({
  title
}) => {
  const defaultTitle = DEFAULT_PAGE_TITLE;
  return <title>{title ? `${title} | Ace React- Responsive Admin Dashboard Template` : defaultTitle}</title>;
};
export default PageMetaData;