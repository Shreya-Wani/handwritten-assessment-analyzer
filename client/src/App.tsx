import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Reviewer } from './pages/Reviewer';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review/:assessmentId" element={<Reviewer />} />
          <Route 
            path="*" 
            element={
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <h2 className="text-xl font-bold text-slate-800">404 - Page Not Found</h2>
                <p className="text-sm text-slate-500 mt-2">The requested dashboard page does not exist.</p>
              </div>
            } 
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
