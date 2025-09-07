interface ImageTransformations {
  width?: number;
  height?: number;
  resize?: 'cover' | 'contain' | 'fill';
  quality?: number;
}

/**
 * Genera un URL per un'immagine ottimizzata da Supabase Storage.
 * @param originalUrl L'URL pubblico originale dell'oggetto in Supabase Storage.
 * @param options Opzioni di trasformazione come larghezza, altezza e modalità di ridimensionamento.
 * @returns L'URL trasformato o l'URL originale se non è un URL di Supabase Storage valido.
 */
export const getOptimizedImageUrl = (
  originalUrl: string | null | undefined,
  options: ImageTransformations = {}
): string | undefined => {
  if (!originalUrl) {
    return undefined;
  }

  // Applica le trasformazioni solo agli URL di Supabase Storage
  if (!originalUrl.includes('supabase.co/storage/v1/object/public')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);

    // Sostituisci il percorso per usare l'API di rendering delle immagini
    if (url.pathname.startsWith('/storage/v1/object/public/')) {
      url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    } else {
      // Se il percorso non corrisponde, restituisci l'URL originale per sicurezza
      return originalUrl;
    }

    // Aggiungi i parametri di trasformazione
    if (options.width) url.searchParams.set('width', String(options.width));
    if (options.height) url.searchParams.set('height', String(options.height));
    if (options.resize) url.searchParams.set('resize', options.resize);
    if (options.quality) url.searchParams.set('quality', String(options.quality));
    
    return url.toString();
  } catch (error) {
    console.error("Invalid URL for image optimization:", originalUrl, error);
    return originalUrl; // Restituisci l'URL originale in caso di errore
  }
};