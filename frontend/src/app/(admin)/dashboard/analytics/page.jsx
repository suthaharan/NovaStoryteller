import { Col, Row } from 'react-bootstrap';
import PageMetaData from '@/components/PageTitle';
import Stats from './components/Stats';
import StoryActivity from './components/StoryActivity';
import RecentStories from './components/RecentStories';

export default function Home() {
  return <>
      <PageMetaData title="Dashboard" />

      <Stats />
      <Row className="mt-4">
        <Col>
          <StoryActivity />
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <RecentStories />
        </Col>
      </Row>
    </>;
}