import type { AnalyticsProvider } from './provider';

/**
 * A concrete implementation of the AnalyticsProvider that logs events to the console.
 * This class has a Single Responsibility: to output analytics data to the console.
 * It's a simple, self-contained module for debugging and development.
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {

  constructor() {
    console.log("ConsoleAnalyticsProvider initialized.");
  }

  /**
   * Logs a page view event to the browser's console.
   * @param pageName - The name of the page being viewed.
   */
  public trackPageView(pageName: string): void {
    console.log(`[Analytics - Console] Page Viewed: ${pageName}`);
  }

  /**
   * Logs a custom event to the browser's console.
   * @param eventName - The name of the event.
   * @param properties - An object of custom properties for the event.
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    console.log(`[Analytics - Console] Event: ${eventName}`, properties);
  }
}
