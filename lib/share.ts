// VERSION: v1.0
// Constante compartida entre app/share/page.tsx y GameMap.tsx.
// Vive aqui (no en page.tsx) porque Next.js no permite exports extra en un archivo de pagina.
export const SHARE_STORAGE_KEY = 'meadow_shared_text';
