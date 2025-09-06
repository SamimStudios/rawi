import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaPlayerProps {
  src?: string;
  poster?: string;
  isGuest?: boolean;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  src,
  poster,
  isGuest = false,
  title,
  className,
  autoPlay = false,
  controls = true,
  muted = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const handlePlayPause = (videoElement: HTMLVideoElement) => {
    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* 16:9 Aspect Ratio Container */}
      <div className="aspect-video bg-black rounded-[var(--radius)] overflow-hidden relative group">
        {src ? (
          <>
            {/* Video Element */}
            <video
              className="w-full h-full object-cover"
              poster={poster}
              controls={controls}
              autoPlay={autoPlay}
              muted={muted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              <source src={src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Custom Play/Pause Overlay */}
            {!autoPlay && showControls && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                onClick={(e) => {
                  const video = e.currentTarget.parentElement?.querySelector('video');
                  if (video) handlePlayPause(video);
                }}
              >
                <div className="bg-black/50 rounded-full p-4 transition-transform hover:scale-110">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" />
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Fallback Poster/Placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              {poster ? (
                <img 
                  src={poster} 
                  alt={title || 'Video poster'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center space-y-4">
                  <Play className="w-16 h-16 text-white mx-auto opacity-60" />
                  {title && (
                    <div className="text-white">
                      <h3 className="text-xl font-semibold">{title}</h3>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Guest Watermark Overlay */}
        {isGuest && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Main Diagonal Watermark */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 60px,
                  rgba(229, 73, 63, 0.1) 60px,
                  rgba(229, 73, 63, 0.1) 120px
                )`
              }}
            >
              <div 
                className="text-white/30 font-bold text-2xl md:text-4xl lg:text-5xl transform -rotate-45 select-none"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  letterSpacing: '0.2em'
                }}
              >
                RAWI PREVIEW
              </div>
            </div>
            
            {/* Corner Watermarks */}
            <div className="absolute top-4 left-4 text-white/20 text-xs font-medium select-none">
              RAWI PREVIEW
            </div>
            <div className="absolute top-4 right-4 text-white/20 text-xs font-medium select-none">
              RAWI PREVIEW
            </div>
            <div className="absolute bottom-4 left-4 text-white/20 text-xs font-medium select-none">
              RAWI PREVIEW
            </div>
            <div className="absolute bottom-4 right-4 text-white/20 text-xs font-medium select-none">
              RAWI PREVIEW
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {src && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-300" id="loading-overlay">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Video Info */}
      {title && !src && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;