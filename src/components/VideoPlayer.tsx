import React from 'react';

interface VideoPlayerProps {
  url: string | null | undefined;
}

const getYouTubeEmbedUrl = (url: string | null | undefined): string | null => {
  if (!url) {
    return null;
  }

  let videoId: string | null = null;

  try {
    const urlObject = new URL(url);
    
    if (urlObject.hostname.includes('youtube.com')) {
      if (urlObject.pathname.includes('/watch')) {
        videoId = urlObject.searchParams.get('v');
      } else if (urlObject.pathname.includes('/embed')) {
        videoId = urlObject.pathname.split('/embed/')[1];
      }
    } else if (urlObject.hostname.includes('youtu.be')) {
      videoId = urlObject.pathname.split('/')[1];
    }
  } catch (error) {
    console.error("Invalid URL provided to VideoPlayer:", url);
    return null;
  }


  if (videoId) {
    // Rimuove eventuali parametri aggiuntivi dall'ID del video
    const cleanVideoId = videoId.split('&')[0];
    return `https://www.youtube.com/embed/${cleanVideoId}`;
  }

  return null;
};

export const VideoPlayer = ({ url }: VideoPlayerProps) => {
  const embedUrl = getYouTubeEmbedUrl(url);

  if (!embedUrl) {
    return null;
  }

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full rounded-lg"
      ></iframe>
    </div>
  );
};