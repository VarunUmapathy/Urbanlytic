
'use client';

import type { AnalyticsProvider } from './analytics/provider';

/**
 * A service class that orchestrates analytics tracking.
 * It depends on an array of `AnalyticsProvider` abstractions, allowing for
 * flexible and extensible tracking capabilities (Open/Closed Principle).
 * It delegates the actual tracking logic to the providers.
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private providers: AnalyticsProvider[];

  /**
   * Private constructor to enforce the Singleton pattern.
   * Initializes with a list of analytics providers.
   * @param providers - An array of objects conforming to the AnalyticsProvider interface.
   */
  private constructor(providers: AnalyticsProvider[]) {
    this.providers = providers;
    console.log("AnalyticsService initialized with providers.");
  }

  /**
   * Implements the Singleton pattern to ensure only one instance of the service exists.
   * This is the single entry point to get the service instance.
   * @param providers - An array of analytics providers to use for tracking.
   */
  public static getInstance(providers: AnalyticsProvider[] = []): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService(providers);
    }
    return AnalyticsService.instance;
  }

  /**
   * Tracks a page view event by delegating to all registered providers.
   * @param pageName - The name of the page being viewed.
   */
  public trackPageView(pageName: string): void {
    this.providers.forEach(provider => provider.trackPageView(pageName));
  }

  /**
   * Tracks a custom event by delegating to all registered providers.
   * @param eventName - The name of the event.
   * @param properties - An object of custom properties for the event.
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    this.providers.forEach(provider => provider.trackEvent(eventName, properties));
  }
}
