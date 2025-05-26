import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PDFUploadPage from './pages/PDFUploadPage';
import QAPage from './pages/QApage';
import LandingPage from './pages/LandingPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<PDFUploadPage />} />
        <Route path="/qa" element={<QAPage />} />
      </Routes>
    </Router>
  );
};

export default App;