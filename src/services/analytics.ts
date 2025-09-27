/**
 * A simple service class for demonstration purposes.
 * In a real-world application, this might send data to an analytics provider.
 */
export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {
    console.log("AnalyticsService initialized.");
  }

  /**
   * Implements the Singleton pattern to ensure only one instance of the service exists.
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Tracks a page view event.
   * @param pageName - The name of the page being viewed.
   */
  public trackPageView(pageName: string): void {
    console.log(`[Analytics] Page Viewed: ${pageName}`);
  }

  /**
   * Tracks a custom event.
   * @param eventName - The name of the event.
   * @param properties - An object of custom properties for the event.
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    console.log(`[Analytics] Event: ${eventName}`, properties);
  }
}
