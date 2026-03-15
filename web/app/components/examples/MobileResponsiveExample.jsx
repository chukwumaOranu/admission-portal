// Example usage of mobile-responsive dashboard components
import React from 'react';
import AdminNavbar from '@/components/dashboard/AdminNavbar';
import SideBar from '@/components/dashboard/SideBar';
import AdminFooter from '@/components/dashboard/AdminFooter';

export default function MobileResponsiveExample() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Responsive Navbar */}
      <AdminNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="d-flex flex-grow-1">
        {/* Responsive Sidebar */}
        <SideBar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main Content with responsive margins */}
        <main 
          className="flex-grow-1 p-3 p-md-4"
          style={{ 
            marginLeft: isMobile ? '0' : (sidebarOpen ? '280px' : '0'),
            transition: 'margin-left 0.3s ease-in-out'
          }}
        >
          <div className="container-fluid">
            <h1>Mobile Responsive Dashboard</h1>
            
            {/* Responsive Cards */}
            <div className="row">
              <div className="col-12 col-md-6 col-lg-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Mobile Card 1</h5>
                    <p className="card-text">This card adapts to different screen sizes.</p>
                  </div>
                </div>
              </div>
              
              <div className="col-12 col-md-6 col-lg-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Mobile Card 2</h5>
                    <p className="card-text">Responsive design at its finest.</p>
                  </div>
                </div>
              </div>
              
              <div className="col-12 col-md-6 col-lg-4 mb-3">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Mobile Card 3</h5>
                    <p className="card-text">Perfect for all devices.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Responsive Table */}
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Doe</td>
                    <td>john@example.com</td>
                    <td>Admin</td>
                    <td><span className="badge bg-success">Active</span></td>
                  </tr>
                  <tr>
                    <td>Jane Smith</td>
                    <td>jane@example.com</td>
                    <td>User</td>
                    <td><span className="badge bg-warning">Pending</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      
      {/* Responsive Footer */}
      <AdminFooter />
    </div>
  );
}