import { logger } from "./logger";

/**
 * Wrapper pour gérer automatiquement les try/catch et les logs d'erreur
 * @param fn La fonction asynchrone à exécuter
 * @param context Le nom du contexte (ex: "ClassName.methodName")
 * @param shouldLog Si true (défaut), log l'erreur via le logger. Si false, ne fait que throw.
 */
export function catchError<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  shouldLog: boolean = true,
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (shouldLog) {
        await logger.error(`Erreur : ${message}`, error, context);
      }
      throw new Error(`[${context}] ${message}`);
    }
  }) as T;
}

/**
 * Wrapper pour gérer automatiquement les try/catch et les logs d'erreur pour les fonctions synchrones
 * @param fn La fonction synchrone à exécuter
 * @param context Le nom du contexte (ex: "ClassName.methodName")
 * @param shouldLog Si true (défaut), log l'erreur via le logger. Si false, ne fait que throw.
 */
export function catchErrorSync<T extends (...args: any[]) => any>(
  fn: T,
  context: string,
  shouldLog: boolean = true,
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (shouldLog) {
        // On n'attend pas la promesse du logger ici pour garder la fonction synchrone
        logger.error(`Erreur : ${message}`, error, context).catch(() => {});
      }
      throw new Error(`[${context}] ${message}`);
    }
  }) as T;
}
