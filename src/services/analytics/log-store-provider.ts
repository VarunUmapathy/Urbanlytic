
'use client';

import type { AnalyticsProvider } from './provider';

export interface LogEntry {
  type: 'pageView' | 'event';
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

// Simple in-memory store for demo purposes.
export const analyticsLogStore: LogEntry[] = [];

/**
 * A concrete implementation of the AnalyticsProvider that stores events in an in-memory array.
 * This allows other parts of the application to read and display the tracked events.
 */
export class LogStoreAnalyticsProvider implements AnalyticsProvider {

  constructor() {
    console.log("LogStoreAnalyticsProvider initialized.");
  }

  /**
   * Adds a page view event to the log store.
   * @param pageName - The name of the page being viewed.
   */
  public trackPageView(pageName: string): void {
    analyticsLogStore.push({
      type: 'pageView',
      name: pageName,
      timestamp: new Date(),
    });
  }

  /**
   * Adds a custom event to the log store.
   * @param eventName - The name of the event.
   * @param properties - An object of custom properties for the event.
   */
  public trackEvent(eventName: string, properties: Record<string, any> = {}): void {
    analyticsLogStore.push({
      type: 'event',
      name: eventName,
      properties,
      timestamp: new Date(),
    });
  }
}
