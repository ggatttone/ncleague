interface GoogleMapEmbedProps {
  lat?: number | null;
  lon?: number | null;
}

export const GoogleMapEmbed = ({ lat, lon }: GoogleMapEmbedProps) => {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return (
      <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Inserisci latitudine e longitudine per visualizzare la mappa.
        </p>
      </div>
    );
  }

  const mapSrc = `https://www.google.com/maps/embed/v1/view?key=&center=${lat},${lon}&zoom=15`;

  return (
    <div className="aspect-video w-full">
      <iframe
        title="Google Maps location"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        src={mapSrc}
        className="rounded-lg"
      ></iframe>
    </div>
  );
};