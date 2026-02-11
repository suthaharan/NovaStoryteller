import { useRef, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';

const AudioPlayer = ({ audioUrl, storyId, isPlaying, onPlayPause, onEnd }) => {
  const audioRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnd = () => {
      setCurrentTime(0);
      if (onEnd) onEnd();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
    };
  }, [onEnd]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error('Error playing audio:', err);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <Button
        variant="outline-primary"
        size="sm"
        onClick={onPlayPause}
        className="d-flex align-items-center"
      >
        <IconifyIcon
          icon={isPlaying ? 'solar:pause-bold' : 'solar:play-bold'}
          width={18}
          height={18}
        />
      </Button>
      <div className="small text-muted">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
};

export default AudioPlayer;

