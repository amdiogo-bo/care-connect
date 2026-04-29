import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="ml-64 flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-6 animate-fade-in">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
