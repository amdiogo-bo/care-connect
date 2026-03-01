/**
 * Toggle entre données mock (frontend seul) et API réelle (backend Laravel).
 *
 * Par défaut : mode mock activé (VITE_USE_MOCK absent ou != 'false').
 * Pour activer l'API réelle : ajouter `VITE_USE_MOCK=false` dans `.env`
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
