import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PDFUploadPage from './features/PDFUploadPage';
import QAPage from './features/QApage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PDFUploadPage />} />
        <Route path="/qa" element={<QAPage />} />
      </Routes>
    </Router>
  );
};

export default App;