/**
 * @fileOverview Defines the abstraction for an analytics provider.
 * This adheres to the Dependency Inversion Principle, allowing high-level
 * modules to depend on this interface rather than concrete implementations.
 */

export interface AnalyticsProvider {
  /**
   * Tracks a page view event.
   * @param pageName - The name of the page being viewed.
   */
  trackPageView(pageName: string): void;

  /**
   * Tracks a custom event.
   * @param eventName - The name of the event.
   * @param properties - An object of custom properties for the event.
   */
  trackEvent(eventName: string, properties: Record<string, any>): void;
}
