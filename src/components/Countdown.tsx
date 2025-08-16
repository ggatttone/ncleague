import { useState, useEffect } from 'react';
import { useEvent } from '@/hooks/use-event';

const Countdown = () => {
  const { data: event, isLoading } = useEvent();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!event || !event.is_active || !event.event_date) {
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(event.event_date!) - +new Date();
      let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return timeLeft;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [event]);

  if (isLoading || !event || !event.is_active || !event.event_date) {
    return null;
  }

  const isFinished = Object.values(timeLeft).every(val => val === 0);

  return (
    <div className="bg-card text-card-foreground py-6 px-4 rounded-lg shadow-lg mb-12 text-center border">
      <h2 className="text-xl md:text-2xl font-semibold text-muted-foreground mb-4">
        {event.title || 'Prossimo evento in arrivo!'}
      </h2>
      {isFinished ? (
        <div className="text-3xl md:text-4xl font-bold text-primary">
          Evento Iniziato!
        </div>
      ) : (
        <div className="grid grid-flow-col gap-5 text-center auto-cols-max justify-center">
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span>{String(timeLeft.days).padStart(2, '0')}</span>
            </span>
            giorni
          </div>
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span>{String(timeLeft.hours).padStart(2, '0')}</span>
            </span>
            ore
          </div>
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
            </span>
            minuti
          </div>
          <div className="flex flex-col">
            <span className="countdown font-mono text-4xl md:text-5xl">
              <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
            </span>
            secondi
          </div>
        </div>
      )}
    </div>
  );
};

export default Countdown;