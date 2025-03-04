import React, { useEffect, useState, useRef } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import ChatComponent from "../components/chat";
import { BASE_URL, MOVIE_BASE_URL } from "../constants/constants";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";


const WatchPage = () => {
  const [connection, setConnection] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [movieUrl, setMovieUrl] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [hostTimestamp, setHostTimestamp] = useState(null);
  const [hostPlaybackState, setHostPlaybackState] = useState(null);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${BASE_URL}/movieSync`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .build();

    newConnection
      .start()
      .then(() => {
        console.log("Connected to MovieSyncHub");
        setIsHost(localStorage.getItem("username") === "suchit");
        setConnection(newConnection);
      })
      .catch((err) => console.error("Error connecting to SignalR:", err));

    newConnection.on("PlaybackUpdated", (playing, timestamp) => {
      if (videoRef.current) {
        const video = videoRef.current;
        const timeDiff = Math.abs(video.currentTime - timestamp);

        if (timeDiff > 0.5) {
          video.currentTime = timestamp;
        }

        if (playing !== !video.paused) {
          playing
            ? video.play().catch((err) => console.error("Error playing video:", err))
            : video.pause();
        }
      }
      setIsPlaying(playing);
      setCurrentTime(timestamp);
      setHostTimestamp(timestamp);
      setHostPlaybackState(playing ? "Playing" : "Paused");
    });

    return () => newConnection.stop().catch((err) => console.error("Error stopping connection:", err));
  }, []);

  useEffect(() => {
    if (isHost && connection && videoRef.current) {
      const interval = setInterval(() => {
        connection.invoke("SyncPlayback", localStorage.getItem("username"), isPlaying, videoRef.current.currentTime)
          .catch((err) => console.error("Error invoking SyncPlayback:", err));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isHost, connection, isPlaying]);

  const handlePlayPause = () => {
    if (connection && isHost && videoRef.current) {
      const video = videoRef.current;
      const newIsPlaying = !isPlaying;
      newIsPlaying ? video.play() : video.pause();
      setIsPlaying(newIsPlaying);
      connection.invoke("SyncPlayback", localStorage.getItem("username"), newIsPlaying, video.currentTime)
        .catch((err) => console.error("Error invoking SyncPlayback:", err));
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen().catch((err) => {
          console.error("Error entering fullscreen:", err);
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-semibold mb-6">Movie Watch Page</h1>
      
        <div className="w-full max-w-4xl mb-6">
          <video
            ref={videoRef}
            src={MOVIE_BASE_URL}
            className="w-full h-auto rounded-lg shadow-lg"
            controls={isHost}
          />
        </div>
      
      {isHost && (
        <button onClick={handlePlayPause} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md">
          {isPlaying ? "Pause" : "Play"}
        </button>
      )}
      <button onClick={handleFullscreen} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md mt-4">
        Fullscreen
      </button>
      <ChatComponent connection={connection} />
      <div className="text-lg text-gray-500 mt-4">
        <p>Host Timestamp: {hostTimestamp}</p>
        <p>Host Playback State: {hostPlaybackState}</p>
      </div>
    </div>
  );
};

export default WatchPage;
