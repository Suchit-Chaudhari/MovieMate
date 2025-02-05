import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username) {
      navigate('/login', { replace: true }); // Use replace to prevent back navigation
    }
  }, [navigate]); // Add navigate to the dependency array

  const handleWatchMovie = () => {
    navigate('/watch');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Welcome to MovieMate 🎬</h1>
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl mb-4">Enjoy Movies with Friends</h2>
        <button
          onClick={handleWatchMovie}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Watch Movie
        </button>
      </div>
    </div>
  );
};

export default Home;
