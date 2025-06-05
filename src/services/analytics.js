// Google Analytics 4 Integration for Reddit Conversations App

class AnalyticsService {
  constructor() {
    this.GA_TRACKING_ID = process.env.REACT_APP_GA_TRACKING_ID || 'G-PLACEHOLDER123';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isInitialized = false;
    this.isDisabled = false; // Flag to disable analytics if issues occur
  }

  // Initialize Google Analytics
  initialize() {
    if (!this.isProduction || this.isInitialized || this.isDisabled) {
      console.log('Analytics: Skipping initialization (dev mode, already initialized, or disabled)');
      return;
    }

    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_TRACKING_ID}`;
      script.onerror = () => {
        console.warn('Analytics: Failed to load gtag script, disabling analytics');
        this.isDisabled = true;
      };
      document.head.appendChild(script);

      // Initialize gtag with additional safety checks
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        if (window.dataLayer && typeof window.dataLayer.push === 'function') {
          window.dataLayer.push(arguments);
        }
      };

      // Add a small delay to ensure script loads
      setTimeout(() => {
        try {
          window.gtag('js', new Date());
          window.gtag('config', this.GA_TRACKING_ID, {
            page_title: 'Reddit Conversations',
            page_location: window.location.href,
            custom_map: {
              'custom_parameter_1': 'subreddit',
              'custom_parameter_2': 'category',
              'custom_parameter_3': 'post_type'
            }
          });
          this.isInitialized = true;
          console.log('✅ Google Analytics initialized');
        } catch (error) {
          console.warn('❌ Failed to configure Google Analytics, disabling:', error);
          this.isDisabled = true;
        }
      }, 100);

    } catch (error) {
      console.warn('❌ Failed to initialize Google Analytics, disabling:', error);
      this.isDisabled = true;
    }
  }

  // Track page views
  trackPageView(page_title, page_location) {
    if (!this.isProduction || !window.gtag || typeof window.gtag !== 'function' || this.isDisabled) return;

    try {
      window.gtag('config', this.GA_TRACKING_ID, {
        page_title,
        page_location: page_location || window.location.href
      });
      console.log(`📊 Page view tracked: ${page_title}`);
    } catch (error) {
      console.warn('❌ Failed to track page view, disabling analytics:', error);
      this.isDisabled = true;
    }
  }

  // Track custom events
  trackEvent(action, category, label = null, value = null, custom_parameters = {}) {
    if (!this.isProduction || !window.gtag || typeof window.gtag !== 'function' || this.isDisabled) return;

    try {
      const eventData = {
        event_category: category,
        event_label: label,
        value: value,
        ...custom_parameters
      };

      window.gtag('event', action, eventData);
      console.log(`📈 Event tracked: ${action} (${category})`);
    } catch (error) {
      console.warn('❌ Failed to track event, disabling analytics:', error);
      this.isDisabled = true;
    }
  }

  // Specific tracking methods for Reddit Conversations app
  
  // Track when a user views a conversation starter
  trackConversationView(post) {
    this.trackEvent('view_conversation', 'engagement', post.subreddit, post.score, {
      subreddit: post.subreddit,
      category: post.category,
      post_id: post.id,
      has_image: post.thumbnail && post.thumbnail !== 'self' ? 'yes' : 'no'
    });
  }

  // Track when a user favorites a post
  trackFavorite(post, action = 'add') {
    this.trackEvent(`${action}_favorite`, 'user_action', post.subreddit, null, {
      subreddit: post.subreddit,
      category: post.category,
      post_id: post.id
    });
  }

  // Track when a user marks a post as read
  trackMarkAsRead(post) {
    this.trackEvent('mark_as_read', 'user_action', post.subreddit, null, {
      subreddit: post.subreddit,
      category: post.category,
      post_id: post.id
    });
  }

  // Track search usage
  trackSearch(searchTerm, resultsCount) {
    this.trackEvent('search', 'user_action', searchTerm, resultsCount, {
      search_term: searchTerm,
      results_count: resultsCount
    });
  }

  // Track filter usage
  trackFilter(filterType, filterValue, resultsCount) {
    this.trackEvent('filter_applied', 'user_action', `${filterType}:${filterValue}`, resultsCount, {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount
    });
  }

  // Track analytics dashboard usage
  trackAnalyticsView(tab) {
    this.trackEvent('view_analytics', 'navigation', tab, null, {
      analytics_tab: tab
    });
  }

  // Track image clicks
  trackImageClick(post) {
    this.trackEvent('image_click', 'engagement', post.subreddit, null, {
      subreddit: post.subreddit,
      category: post.category,
      post_id: post.id
    });
  }

  // Track load more button clicks
  trackLoadMore(currentCount) {
    this.trackEvent('load_more', 'navigation', 'posts', currentCount, {
      current_post_count: currentCount
    });
  }

  // Track user session quality
  trackSessionMetrics() {
    const sessionStart = performance.now();
    
    // Track session duration when user leaves
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Math.round((performance.now() - sessionStart) / 1000);
      this.trackEvent('session_duration', 'engagement', 'seconds', sessionDuration, {
        duration_seconds: sessionDuration
      });
    });
  }

  // Track performance metrics
  trackPerformance() {
    if (!this.isProduction || this.isDisabled) return;

    try {
      // Track Core Web Vitals with enhanced error handling
      import('web-vitals')
        .then(({ getLCP, getFID, getCLS, getFCP, getTTFB }) => {
          if (this.isDisabled) return; // Check if analytics was disabled during import

          try {
            getLCP((metric) => {
              if (!this.isDisabled) {
                this.trackEvent('web_vitals', 'performance', 'LCP', Math.round(metric.value), {
                  metric_name: 'largest_contentful_paint',
                  metric_value: Math.round(metric.value)
                });
              }
            });

            getFID((metric) => {
              if (!this.isDisabled) {
                this.trackEvent('web_vitals', 'performance', 'FID', Math.round(metric.value), {
                  metric_name: 'first_input_delay',
                  metric_value: Math.round(metric.value)
                });
              }
            });

            getCLS((metric) => {
              if (!this.isDisabled) {
                this.trackEvent('web_vitals', 'performance', 'CLS', Math.round(metric.value * 1000), {
                  metric_name: 'cumulative_layout_shift',
                  metric_value: Math.round(metric.value * 1000)
                });
              }
            });

            getFCP((metric) => {
              if (!this.isDisabled) {
                this.trackEvent('web_vitals', 'performance', 'FCP', Math.round(metric.value), {
                  metric_name: 'first_contentful_paint',
                  metric_value: Math.round(metric.value)
                });
              }
            });

            getTTFB((metric) => {
              if (!this.isDisabled) {
                this.trackEvent('web_vitals', 'performance', 'TTFB', Math.round(metric.value), {
                  metric_name: 'time_to_first_byte',
                  metric_value: Math.round(metric.value)
                });
              }
            });
          } catch (innerError) {
            console.warn('❌ Failed to set up web vitals tracking:', innerError);
            this.isDisabled = true;
          }
        })
        .catch((error) => {
          console.warn('❌ Failed to import web-vitals, disabling performance tracking:', error);
          // Don't disable all analytics for web-vitals failure, just skip performance tracking
        });
    } catch (error) {
      console.warn('❌ Failed to track performance metrics:', error);
    }
  }

  // Track conversion events
  trackConversion(type, value = null) {
    this.trackEvent('conversion', 'business', type, value, {
      conversion_type: type
    });
  }

  // Track errors
  trackError(error, context = 'unknown') {
    if (this.isDisabled) return;
    
    try {
      this.trackEvent('error', 'technical', context, null, {
        error_message: error.message || error,
        error_context: context
      });
    } catch (trackingError) {
      console.warn('❌ Failed to track error, disabling analytics:', trackingError);
      this.isDisabled = true;
    }
  }

  // Track category selection (mobile)
  trackCategorySelection(category, context = 'desktop') {
    this.trackEvent('select_category', 'navigation', category.id || category, null, {
      category_id: category.id || category,
      category_name: category.name || category,
      context: context
    });
  }

  // Track subreddit selection (mobile)
  trackSubredditSelection(subreddit, context = 'desktop') {
    this.trackEvent('select_subreddit', 'navigation', subreddit, null, {
      subreddit: subreddit,
      context: context
    });
  }

  // Track post view (mobile)
  trackPostView(post, context = 'desktop') {
    this.trackEvent('view_post', 'engagement', post.subreddit, post.score, {
      subreddit: post.subreddit,
      category: post.category,
      post_id: post.id,
      context: context
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Initialize analytics on import (in production)
if (typeof window !== 'undefined') {
  analytics.initialize();
} 