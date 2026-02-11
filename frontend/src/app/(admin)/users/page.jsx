import PageMetaData from '@/components/PageTitle';
import UsersList from './components/UsersList';

const Users = () => {
  return (
    <>
      <PageMetaData title="Users Management" />
      <UsersList />
    </>
  );
};

export default Users;


