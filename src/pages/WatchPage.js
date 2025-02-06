import React, { useEffect, useState, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import ChatComponent from '../components/chat'; // Import the chat component
import { BASE_URL, MOVIE_BASE_URL } from '../constants/constants';
import { useNavigate } from 'react-router-dom';

const LOGIC_APP_URL = "https://prod-02.northcentralus.logic.azure.com/workflows/d8f674bb74c94ec4a1eeb2a49e36fe58/triggers/When_a_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_a_HTTP_request_is_received%2Frun&sv=1.0&sig=rywwlN76qwqpGLuKRzCGxFlTGxp9xZIitIFGHFEv8yI";
const BLOB_BASE_URL = "https://movieblob.blob.core.windows.net";

const WatchPage = () => {
  const [connection, setConnection] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [movieUrl, setMovieUrl] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hostTimestamp, setHostTimestamp] = useState(null);
  const [hostPlaybackState, setHostPlaybackState] = useState(null);
  const navigate = useNavigate();
  const videoRef = useRef(null);
  
  useEffect(() => {
    const username = localStorage.getItem('username');
    if(!username){
      navigate('/login');
    }
    const fetchMovieUrl = async () => {
      try {
        const response = await fetch(LOGIC_APP_URL);
        const data = await response.json();
        if (data.Path) {
          setMovieUrl(`${BLOB_BASE_URL}${data.Path}`);
        }
      } catch (error) {
        console.error("Error fetching movie URL:", error);
      }
    };
    fetchMovieUrl();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/movieSync`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .build();

    newConnection.start()
      .then(() => {
        console.log("Connected to MovieSyncHub");
        setIsHost(localStorage.getItem('username') === 'suchit');
        setConnection(newConnection);
      })
      .catch((err) => console.error("Error connecting to SignalR:", err));

    newConnection.on("PlaybackUpdated", (playing, timestamp) => {
      setIsPlaying(playing);
      setCurrentTime(timestamp);
      if (videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - timestamp) > 0.5) {
          videoRef.current.currentTime = timestamp;
        }
        if (playing) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
      setHostTimestamp(timestamp);
      setHostPlaybackState(playing ? 'Playing' : 'Paused');
    });

    return () => newConnection.stop().catch((err) => console.error("Error stopping connection:", err));
  }, []);

  const handlePlayPause = () => {
    if (connection && isHost) {
      const newIsPlaying = !isPlaying;
      setIsPlaying(newIsPlaying);
      newIsPlaying ? videoRef.current.play() : videoRef.current.pause();
      const username = localStorage.getItem("username");
      connection.invoke("SyncPlayback", username, newIsPlaying, videoRef.current.currentTime)
        .catch((err) => console.error("Error invoking SyncPlayback:", err));
    }
  };

  const handleSeek = (newTime) => {
    if (connection && isHost) {
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
      const username = localStorage.getItem("username");
      connection.invoke("SyncPlayback", username, isPlaying, newTime)
        .catch((err) => console.error("Error invoking SyncPlayback:", err));
    }
  };

  const handleTimeUpdate = () => {
    if (connection && isHost && videoRef.current) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);
      connection.invoke("SyncPlayback", localStorage.getItem("username"), isPlaying, newTime)
        .catch((err) => console.error("Error invoking SyncPlayback:", err));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-semibold mb-6">Movie Watch Page</h1>
      {movieUrl && (
        <div className="w-full max-w-4xl mb-6">
          <video
            ref={videoRef}
            src={`${MOVIE_BASE_URL}/sources/part4.mp4`}
            className="w-full h-auto rounded-lg shadow-lg"
            controls={isHost}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
      )}
      {isHost && (
        <div className="flex space-x-4">
          <button onClick={handlePlayPause} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button onClick={() => handleSeek(hostTimestamp - 10)} className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md">
            Rewind 10s
          </button>
          <button onClick={() => handleSeek(hostTimestamp + 10)} className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md">
            Forward 10s
          </button>
        </div>
      )}
      {!isHost && (
        <div className="text-lg text-gray-500 mt-4">You are watching the movie in sync with the host.</div>
      )}
      <ChatComponent connection={connection} />
      <div className="text-lg text-gray-500 mt-4">
        <p>Host Timestamp: {hostTimestamp}</p>
        <p>Host Playback State: {hostPlaybackState}</p>
      </div>
    </div>
  );
};

export default WatchPage;
