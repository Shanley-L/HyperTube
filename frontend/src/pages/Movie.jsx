import React from 'react';
import { useParams } from 'react-router-dom';

const MoviePage = () => {
  const { id } = useParams();

  const videoUrl = `http://localhost:5173/api/video/stream/${id}`;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Watching Movie: {id}</h1>
      
      <div className="video-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <video 
          controls 
          width="100%" 
          crossOrigin="anonymous"
        >
          <source src={videoUrl} type="video/mp4" />
          {/* Subtitles ?*/}
          Your browser does not support the video tag.
        </video>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Movie Info</h3>
        <p>best film EUW</p>
      </div>
    </div>
  );
};

export default MoviePage;