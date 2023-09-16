/*import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useUserAuth } from "../UserContextProvider";

function GalleryLink() {
  const [galleryUrl, setGalleryUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUserAuth();
  const userId = user?.uid;

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/events/getgallery/${userId}`)
      .then((response) => {
        setGalleryUrl(response.data.galleryUrl);
        setLoading(false); // Set loading to false when data is fetched
      })
      .catch((error) => {
        console.error('Error fetching gallery URL:', error);
        setError(error); // Set the error state if there's an error
        setLoading(false); // Set loading to false on error
      });
  }, [userId]);

  return (
    <div>
      <h1>Gallery URL</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error.message}</p>
      ) : (
        <>
          <p>{galleryUrl}</p>
          {galleryUrl && (
            <Link to={galleryUrl} target="_blank">
              <button>Go to Gallery</button>
            </Link>
          )}
        </>
      )}
    </div>
  );
}

export default GalleryLink;*/
