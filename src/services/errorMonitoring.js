// Sentry Error Monitoring for Reddit Conversations App
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

class ErrorMonitoringService {
  constructor() {
    this.SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isInitialized = false;
  }

  // Initialize Sentry error monitoring
  initialize() {
    if (!this.isProduction || this.isInitialized || !this.SENTRY_DSN) {
      console.log('Error Monitoring: Skipping initialization (dev mode, already initialized, or no DSN)');
      return;
    }

    try {
      Sentry.init({
        dsn: this.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: `reddit-conversations@${process.env.REACT_APP_VERSION || '1.0.0'}`,
        integrations: [
          new BrowserTracing({
            // Set routing instrumentation
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              React.useEffect,
              window.location,
              window.history
            ),
          }),
        ],
        
        // Performance Monitoring
        tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
        
        // Error Filtering
        beforeSend(event, hint) {
          // Filter out common non-critical errors
          const error = hint.originalException;
          
          // Don't send network errors for development
          if (error && error.message && error.message.includes('Network Error')) {
            return null;
          }
          
          // Don't send ResizeObserver errors (common browser quirk)
          if (error && error.message && error.message.includes('ResizeObserver')) {
            return null;
          }
          
          // Add user context
          event.tags = {
            ...event.tags,
            component: 'reddit-conversations',
            feature: hint.feature || 'unknown'
          };
          
          return event;
        },
        
        // Session Tracking
        autoSessionTracking: true,
        
        // User Privacy
        sendDefaultPii: false,
        
        // Debug mode (only in development)
        debug: !this.isProduction,
      });

      // Set initial context
      Sentry.setContext('app', {
        name: 'Reddit Conversations',
        version: process.env.REACT_APP_VERSION || '1.0.0',
        build: process.env.REACT_APP_BUILD_ID || 'local'
      });

      this.isInitialized = true;
      console.log('✅ Sentry error monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  // Set user context for better error tracking
  setUser(userInfo) {
    if (!this.isProduction) return;
    
    Sentry.setUser({
      id: userInfo.id || 'anonymous',
      username: userInfo.username || 'anonymous',
      ...userInfo
    });
  }

  // Set additional context
  setContext(key, context) {
    if (!this.isProduction) return;
    
    Sentry.setContext(key, context);
  }

  // Add breadcrumb for debugging
  addBreadcrumb(message, category = 'info', level = 'info', data = {}) {
    if (!this.isProduction) return;
    
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data
    });
  }

  // Capture exceptions
  captureException(error, context = {}) {
    if (!this.isProduction) {
      console.error('Error (dev mode):', error, context);
      return;
    }

    Sentry.withScope((scope) => {
      // Add context
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
      
      // Add extra data
      scope.setExtra('timestamp', new Date().toISOString());
      scope.setExtra('userAgent', navigator.userAgent);
      scope.setExtra('url', window.location.href);
      
      Sentry.captureException(error);
    });
  }

  // Capture custom messages
  captureMessage(message, level = 'info', context = {}) {
    if (!this.isProduction) {
      console.log(`Message (${level}):`, message, context);
      return;
    }

    Sentry.withScope((scope) => {
      scope.setLevel(level);
      
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
      
      Sentry.captureMessage(message);
    });
  }

  // Performance monitoring
  startTransaction(name, operation = 'navigation') {
    if (!this.isProduction) return null;
    
    return Sentry.startTransaction({
      name,
      op: operation
    });
  }

  // Specific error handlers for Reddit Conversations app
  
  // Track API errors
  trackAPIError(error, endpoint, method = 'GET') {
    this.captureException(error, {
      feature: 'api',
      endpoint,
      method,
      error_type: 'api_error'
    });
  }

  // Track Firebase errors
  trackFirebaseError(error, operation) {
    this.captureException(error, {
      feature: 'firebase',
      operation,
      error_type: 'firebase_error'
    });
  }

  // Track UI errors
  trackUIError(error, component, action = 'unknown') {
    this.captureException(error, {
      feature: 'ui',
      component,
      action,
      error_type: 'ui_error'
    });
  }

  // Track performance issues
  trackPerformanceIssue(metric, value, context = {}) {
    this.captureMessage(`Performance issue: ${metric} = ${value}`, 'warning', {
      feature: 'performance',
      metric,
      value,
      ...context
    });
  }

  // Track user feedback
  trackUserFeedback(feedback, context = {}) {
    this.captureMessage(`User feedback: ${feedback}`, 'info', {
      feature: 'feedback',
      ...context
    });
  }

  // React Error Boundary integration
  static createErrorBoundary() {
    return Sentry.withErrorBoundary;
  }

  // Show user feedback dialog
  showReportDialog() {
    if (!this.isProduction) return;
    
    Sentry.showReportDialog({
      title: 'Something went wrong',
      subtitle: 'Help us improve Reddit Conversations by reporting this issue.',
      subtitle2: 'Your feedback helps us fix bugs and improve the app.',
      labelSubmit: 'Send Report',
      labelClose: 'Close',
      errorGeneric: 'An unknown error occurred while submitting your report.',
      errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
      successMessage: 'Your report has been sent. Thank you for helping us improve!'
    });
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// Initialize error monitoring on import (in production)
if (typeof window !== 'undefined') {
  errorMonitoring.initialize();
}

// Export Sentry for direct use if needed
export { Sentry }; 