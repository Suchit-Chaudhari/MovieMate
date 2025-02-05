// src/routes.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import WatchPage from './pages/WatchPage'; // Assuming you've created this page

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/watch" element={<WatchPage />} /> {/* Direct watch page */}
    </Routes>
  </Router>
);

export default AppRoutes;
