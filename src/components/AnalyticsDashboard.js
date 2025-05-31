import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';
import { postService } from '../services/postService';
import { analytics } from '../services/analytics';
import LoadingSpinner from './LoadingSpinner';

const AnalyticsDashboard = () => {
  const [analytics_data, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await postService.getAnalytics(dateRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      analytics.trackError(error, 'analytics_dashboard_load');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    analytics.trackAnalyticsInteraction('tab_change', { tab });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || '0';
  };

  const formatPercentage = (value, total) => {
    if (!total || total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <LoadingSpinner />
        <p>Analyzing conversation data...</p>
      </div>
    );
  }

  if (!analytics_data) {
    return (
      <div className="analytics-error">
        <h2>Unable to load analytics</h2>
        <p>Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>📊 Conversation Analytics Dashboard</h1>
        <p>Insights into your Reddit conversation starter collection</p>
        
        <div className="analytics-controls">
          <div className="date-selector">
            <label>Time Range:</label>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="7d">Last 7 Days</option>
              <option value="1d">Last 24 Hours</option>
            </select>
          </div>
        </div>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => handleTabChange('content')}
        >
          📝 Content
        </button>
        <button 
          className={`tab ${activeTab === 'subreddits' ? 'active' : ''}`}
          onClick={() => handleTabChange('subreddits')}
        >
          🏠 Subreddits
        </button>
        <button 
          className={`tab ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => handleTabChange('engagement')}
        >
          💬 Engagement
        </button>
        <button 
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => handleTabChange('trends')}
        >
          🔥 Trends
        </button>
        <button 
          className={`tab ${activeTab === 'quality' ? 'active' : ''}`}
          onClick={() => handleTabChange('quality')}
        >
          ⭐ Quality
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-info">
                  <h3>Total Posts</h3>
                  <div className="metric-value">{formatNumber(analytics_data.overview.totalPosts)}</div>
                  <div className="metric-label">High-quality stories</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🏆</div>
                <div className="metric-info">
                  <h3>Avg Score</h3>
                  <div className="metric-value">{Math.round(analytics_data.overview.averageScore)}</div>
                  <div className="metric-label">Points per post</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">💬</div>
                <div className="metric-info">
                  <h3>Total Comments</h3>
                  <div className="metric-value">{formatNumber(analytics_data.overview.totalComments)}</div>
                  <div className="metric-label">Discussions started</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🌐</div>
                <div className="metric-info">
                  <h3>Subreddits</h3>
                  <div className="metric-value">{analytics_data.overview.totalSubreddits}</div>
                  <div className="metric-label">Communities covered</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🖼️</div>
                <div className="metric-info">
                  <h3>Visual Content</h3>
                  <div className="metric-value">{formatPercentage(analytics_data.overview.imagePosts, analytics_data.overview.totalPosts)}</div>
                  <div className="metric-label">Posts with images</div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">⚡</div>
                <div className="metric-info">
                  <h3>Engagement Rate</h3>
                  <div className="metric-value">{analytics_data.overview.engagementRate.toFixed(1)}</div>
                  <div className="metric-label">Comments per post</div>
                </div>
              </div>
            </div>

            <div className="charts-section">
              <div className="chart-container">
                <h3>📊 Content Distribution by Category</h3>
                <div className="category-chart">
                  {analytics_data.categories.map((category, index) => (
                    <div key={category.name} className="category-bar">
                      <div className="category-label">{category.name}</div>
                      <div className="category-progress">
                        <div 
                          className="category-fill"
                          style={{ 
                            width: formatPercentage(category.count, analytics_data.overview.totalPosts),
                            backgroundColor: `hsl(${index * 137.5 % 360}, 70%, 60%)`
                          }}
                        ></div>
                      </div>
                      <div className="category-stats">
                        {formatNumber(category.count)} ({formatPercentage(category.count, analytics_data.overview.totalPosts)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-container">
                <h3>🏅 Top Performing Subreddits</h3>
                <div className="subreddit-leaderboard">
                  {analytics_data.topSubreddits.slice(0, 10).map((subreddit, index) => (
                    <div key={subreddit.name} className="subreddit-item">
                      <div className="subreddit-rank">#{index + 1}</div>
                      <div className="subreddit-info">
                        <div className="subreddit-name">r/{subreddit.name}</div>
                        <div className="subreddit-stats">
                          {formatNumber(subreddit.count)} posts • {Math.round(subreddit.avgScore)} avg score
                        </div>
                      </div>
                      <div className="subreddit-score">{formatNumber(subreddit.totalScore)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-tab">
            <div className="content-section">
              <h3>🎯 Top Performing Posts</h3>
              <div className="top-posts">
                {analytics_data.topPosts.map((post, index) => (
                  <div key={post.id} className="top-post-card">
                    <div className="post-rank">#{index + 1}</div>
                    <div className="post-info">
                      <h4>{post.title}</h4>
                      <div className="post-meta">
                        <span className="post-subreddit">r/{post.subreddit}</span>
                        <span className="post-stats">
                          🏆 {formatNumber(post.score)} points • 💬 {formatNumber(post.num_comments)} comments
                        </span>
                      </div>
                    </div>
                    {post.hasImage && <div className="post-indicator">🖼️</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="content-insights">
              <div className="insight-card">
                <h4>📈 Content Performance</h4>
                <div className="insight-stats">
                  <div className="stat">
                    <span className="stat-label">Highest Scoring Post:</span>
                    <span className="stat-value">{formatNumber(analytics_data.insights.maxScore)} points</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Most Discussed Post:</span>
                    <span className="stat-value">{formatNumber(analytics_data.insights.maxComments)} comments</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Average Post Length:</span>
                    <span className="stat-value">{Math.round(analytics_data.insights.avgLength)} characters</span>
                  </div>
                </div>
              </div>

              <div className="insight-card">
                <h4>🎭 Content Types</h4>
                <div className="content-types">
                  <div className="content-type">
                    <span className="type-icon">📝</span>
                    <span className="type-label">Text Posts</span>
                    <span className="type-count">{formatNumber(analytics_data.insights.textPosts)}</span>
                  </div>
                  <div className="content-type">
                    <span className="type-icon">🖼️</span>
                    <span className="type-label">Image Posts</span>
                    <span className="type-count">{formatNumber(analytics_data.insights.imagePosts)}</span>
                  </div>
                  <div className="content-type">
                    <span className="type-icon">🔗</span>
                    <span className="type-label">Link Posts</span>
                    <span className="type-count">{formatNumber(analytics_data.insights.linkPosts)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subreddits' && (
          <div className="subreddits-tab">
            <div className="subreddits-intro">
              <h3>📚 Complete Subreddit Collection</h3>
              <p>We curate content from 57 high-quality subreddits across 12 categories to bring you the most engaging conversation starters.</p>
            </div>

            <div className="subreddits-categories">
              <div className="subreddit-category">
                <h4>💕 Relationships & Dating (8 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/relationships</h5>
                    <p>Real relationship advice, breakup stories, and dating dilemmas. Perfect for discussing modern romance challenges.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/relationship_advice</h5>
                    <p>Specific advice for relationship problems. Great conversation starters about love, trust, and communication.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/dating_advice</h5>
                    <p>Dating tips, first date stories, and modern dating culture discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/AmItheAsshole</h5>
                    <p>Moral dilemmas and ethical questions that spark great debates about right and wrong.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/DeadBedrooms</h5>
                    <p>Honest discussions about intimacy challenges in long-term relationships.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/survivinginfidelity</h5>
                    <p>Stories of betrayal, healing, and rebuilding trust in relationships.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/datingoverthirty</h5>
                    <p>Mature dating perspectives and challenges of finding love later in life.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/dating</h5>
                    <p>General dating experiences, success stories, and modern dating challenges.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>💍 Wedding & Marriage (8 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/weddingshaming</h5>
                    <p>Outrageous wedding behavior and bridezilla stories that make for entertaining discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/bridezillas</h5>
                    <p>Extreme wedding planning gone wrong - perfect for discussing wedding etiquette.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/weddingplanning</h5>
                    <p>Real wedding planning challenges, budget discussions, and celebration ideas.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/wedding</h5>
                    <p>Beautiful wedding stories, traditions, and celebration inspiration.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/weddingdrama</h5>
                    <p>Family conflicts and drama surrounding wedding celebrations.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/JUSTNOMIL</h5>
                    <p>Mother-in-law stories and family boundary discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/JustNoSO</h5>
                    <p>Relationship red flags and toxic partner behavior discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/Weddingsunder10k</h5>
                    <p>Budget-friendly wedding ideas and creative celebration planning.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>🔥 Drama & Revenge (7 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/pettyrevenge</h5>
                    <p>Satisfying stories of small-scale revenge and justice served cold.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/MaliciousCompliance</h5>
                    <p>Following rules to the letter with deliciously unexpected consequences.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/entitledparents</h5>
                    <p>Outrageous parent behavior and helicopter parenting gone wrong.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/ChoosingBeggars</h5>
                    <p>Unreasonable demands and entitled behavior in everyday situations.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/PublicFreakout</h5>
                    <p>Wild public meltdowns and dramatic confrontations.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/NuclearRevenge</h5>
                    <p>Epic revenge stories with life-changing consequences.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/ProRevenge</h5>
                    <p>Professional-level revenge executed with precision and planning.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>💼 Work & Career (6 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/antiwork</h5>
                    <p>Workplace frustrations, toxic bosses, and career liberation stories.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/TalesFromRetail</h5>
                    <p>Customer service horror stories and retail worker experiences.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/WorkReform</h5>
                    <p>Discussions about improving workplace conditions and worker rights.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/jobs</h5>
                    <p>Job hunting experiences, career advice, and workplace challenges.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/careerguidance</h5>
                    <p>Professional development advice and career transition stories.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/cscareerquestions</h5>
                    <p>Tech industry careers, coding interviews, and software development paths.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>🏠 Family & Home (6 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/raisedbynarcissists</h5>
                    <p>Healing from toxic family relationships and childhood trauma.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/JUSTNOFAMILY</h5>
                    <p>Setting boundaries with difficult family members.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/badroommates</h5>
                    <p>Roommate horror stories and shared living nightmares.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/Parenting</h5>
                    <p>Real parenting challenges, milestones, and family life discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/EstrangedAdultChild</h5>
                    <p>Stories of cutting ties with toxic family members.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/neighborsfromhell</h5>
                    <p>Boundary disputes and difficult neighbor situations.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>📚 Stories & Entertainment (5 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/tifu</h5>
                    <p>Hilarious "Today I F*cked Up" stories of embarrassing mistakes.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/confession</h5>
                    <p>Deep, personal confessions that reveal human nature.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/offmychest</h5>
                    <p>Emotional releases and personal revelations people need to share.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/TrueOffMyChest</h5>
                    <p>Unfiltered personal stories and honest emotional expressions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/nosleep</h5>
                    <p>Creepy stories and horror tales that blur the line between fiction and reality.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>💡 Advice & Self-Help (5 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/Advice</h5>
                    <p>General life guidance and problem-solving discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/personalfinance</h5>
                    <p>Money management, budgeting tips, and financial planning advice.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/self</h5>
                    <p>Personal growth, self-reflection, and life philosophy discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/getmotivated</h5>
                    <p>Inspirational stories and motivation for personal improvement.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/lifetips</h5>
                    <p>Practical advice and life hacks for everyday challenges.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>💰 Money & Finance (4 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/investing</h5>
                    <p>Investment strategies, market discussions, and wealth building.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/financialindependence</h5>
                    <p>FIRE movement stories and paths to financial freedom.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/Frugal</h5>
                    <p>Money-saving tips, budget living, and smart spending strategies.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/personalfinance</h5>
                    <p>Comprehensive financial advice and money management guidance.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>📱 Technology & Gaming (3 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/technology</h5>
                    <p>Latest tech news, innovations, and digital culture discussions.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/gaming</h5>
                    <p>Video game discussions, reviews, and gaming culture stories.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/pcmasterrace</h5>
                    <p>PC gaming enthusiasm, tech builds, and computer culture.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>🎯 Lifestyle & Hobbies (3 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/AskReddit</h5>
                    <p>Thought-provoking questions that reveal interesting perspectives.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/mildlyinfuriating</h5>
                    <p>Small annoyances and everyday frustrations we all relate to.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/unpopularopinion</h5>
                    <p>Controversial takes and unconventional viewpoints on various topics.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>🏥 Health & Mental Health (2 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/mentalhealth</h5>
                    <p>Mental health discussions, support, and wellness strategies.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/depression</h5>
                    <p>Support community for those dealing with depression and mental health challenges.</p>
                  </div>
                </div>
              </div>

              <div className="subreddit-category">
                <h4>🌍 Social Issues (2 subreddits)</h4>
                <div className="subreddit-grid">
                  <div className="subreddit-card">
                    <h5>r/politics</h5>
                    <p>Political discussions, current events, and civic engagement topics.</p>
                  </div>
                  <div className="subreddit-card">
                    <h5>r/TwoXChromosomes</h5>
                    <p>Women's perspectives, experiences, and gender-related discussions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="subreddits-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <h4>57</h4>
                  <p>Total Subreddits</p>
                </div>
                <div className="stat-item">
                  <h4>12</h4>
                  <p>Categories</p>
                </div>
                <div className="stat-item">
                  <h4>5,700+</h4>
                  <p>Posts Collected</p>
                </div>
                <div className="stat-item">
                  <h4>Daily</h4>
                  <p>Content Updates</p>
                </div>
              </div>
              <p className="summary-text">
                Our carefully curated collection spans the most engaging Reddit communities, 
                ensuring you have access to diverse, high-quality conversation starters for any situation.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="engagement-tab">
            <div className="engagement-metrics">
              <div className="engagement-card">
                <h4>💖 User Favorites</h4>
                <div className="engagement-stat">
                  <div className="big-number">{formatNumber(analytics_data.engagement.totalFavorites)}</div>
                  <div className="stat-description">Posts favorited by users</div>
                </div>
              </div>

              <div className="engagement-card">
                <h4>👁️ Reading Activity</h4>
                <div className="engagement-stat">
                  <div className="big-number">{formatNumber(analytics_data.engagement.totalReads)}</div>
                  <div className="stat-description">Posts read by users</div>
                </div>
              </div>

              <div className="engagement-card">
                <h4>🔍 Search Usage</h4>
                <div className="engagement-stat">
                  <div className="big-number">{formatNumber(analytics_data.engagement.searchQueries)}</div>
                  <div className="stat-description">Search queries performed</div>
                </div>
              </div>
            </div>

            <div className="popular-searches">
              <h4>🔥 Popular Search Terms</h4>
              <div className="search-cloud">
                {analytics_data.engagement.topSearches.map((search, index) => (
                  <div 
                    key={search.term} 
                    className="search-term"
                    style={{ fontSize: `${Math.max(12, Math.min(24, search.count * 2))}px` }}
                  >
                    {search.term}
                  </div>
                ))}
              </div>
            </div>

            <div className="most-engaging">
              <h4>⭐ Most Engaging Content</h4>
              <div className="engaging-posts">
                {analytics_data.engagement.mostEngaging.map((post, index) => (
                  <div key={post.id} className="engaging-post">
                    <div className="engagement-indicator">
                      <span className="favorites">❤️ {post.favorites}</span>
                      <span className="reads">👁️ {post.reads}</span>
                    </div>
                    <div className="post-title">{post.title}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="trends-tab">
            <div className="trending-topics">
              <h4>🔥 Trending Topics</h4>
              <div className="trend-indicators">
                {analytics_data.trends.topics.map((topic, index) => (
                  <div key={topic.keyword} className="trend-item">
                    <div className="trend-rank">#{index + 1}</div>
                    <div className="trend-info">
                      <div className="trend-keyword">{topic.keyword}</div>
                      <div className="trend-stats">
                        {topic.mentions} mentions • +{topic.growth}% growth
                      </div>
                    </div>
                    <div className={`trend-arrow ${topic.growth > 0 ? 'up' : 'down'}`}>
                      {topic.growth > 0 ? '📈' : '📉'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="seasonal-insights">
              <h4>📅 Content Patterns</h4>
              <div className="pattern-insights">
                <div className="pattern-item">
                  <span className="pattern-icon">⏰</span>
                  <div className="pattern-info">
                    <div className="pattern-title">Peak Activity</div>
                    <div className="pattern-detail">{analytics_data.trends.peakTime}</div>
                  </div>
                </div>
                <div className="pattern-item">
                  <span className="pattern-icon">📊</span>
                  <div className="pattern-info">
                    <div className="pattern-title">Best Performing Day</div>
                    <div className="pattern-detail">{analytics_data.trends.bestDay}</div>
                  </div>
                </div>
                <div className="pattern-item">
                  <span className="pattern-icon">🎯</span>
                  <div className="pattern-info">
                    <div className="pattern-title">Optimal Length</div>
                    <div className="pattern-detail">{analytics_data.trends.optimalLength} characters</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="growth-metrics">
              <h4>📈 Growth Insights</h4>
              <div className="growth-stats">
                <div className="growth-item">
                  <div className="growth-label">Content Volume Growth</div>
                  <div className="growth-value">+{analytics_data.trends.contentGrowth}%</div>
                </div>
                <div className="growth-item">
                  <div className="growth-label">Engagement Growth</div>
                  <div className="growth-value">+{analytics_data.trends.engagementGrowth}%</div>
                </div>
                <div className="growth-item">
                  <div className="growth-label">Quality Score Trend</div>
                  <div className="growth-value">+{analytics_data.trends.qualityTrend}%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="quality-tab">
            <div className="quality-metrics">
              <div className="quality-score">
                <h4>⭐ Overall Quality Score</h4>
                <div className="score-display">
                  <div className="score-number">{analytics_data.quality.overallScore.toFixed(1)}</div>
                  <div className="score-scale">/10</div>
                </div>
                <div className="score-description">
                  Based on engagement, scores, and content quality
                </div>
              </div>

              <div className="quality-breakdown">
                <h4>📊 Quality Breakdown</h4>
                <div className="quality-factors">
                  <div className="quality-factor">
                    <span className="factor-name">Content Depth</span>
                    <div className="factor-bar">
                      <div 
                        className="factor-fill"
                        style={{ width: `${analytics_data.quality.contentDepth * 10}%` }}
                      ></div>
                    </div>
                    <span className="factor-score">{analytics_data.quality.contentDepth.toFixed(1)}</span>
                  </div>
                  <div className="quality-factor">
                    <span className="factor-name">Engagement Quality</span>
                    <div className="factor-bar">
                      <div 
                        className="factor-fill"
                        style={{ width: `${analytics_data.quality.engagementQuality * 10}%` }}
                      ></div>
                    </div>
                    <span className="factor-score">{analytics_data.quality.engagementQuality.toFixed(1)}</span>
                  </div>
                  <div className="quality-factor">
                    <span className="factor-name">Community Response</span>
                    <div className="factor-bar">
                      <div 
                        className="factor-fill"
                        style={{ width: `${analytics_data.quality.communityResponse * 10}%` }}
                      ></div>
                    </div>
                    <span className="factor-score">{analytics_data.quality.communityResponse.toFixed(1)}</span>
                  </div>
                  <div className="quality-factor">
                    <span className="factor-name">Content Diversity</span>
                    <div className="factor-bar">
                      <div 
                        className="factor-fill"
                        style={{ width: `${analytics_data.quality.contentDiversity * 10}%` }}
                      ></div>
                    </div>
                    <span className="factor-score">{analytics_data.quality.contentDiversity.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="quality-insights">
              <h4>💡 Quality Insights</h4>
              <div className="insights-list">
                {analytics_data.quality.insights.map((insight, index) => (
                  <div key={index} className="insight-item">
                    <span className="insight-icon">{insight.icon}</span>
                    <span className="insight-text">{insight.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="recommendations">
              <h4>🎯 Recommendations</h4>
              <div className="recommendations-list">
                {analytics_data.quality.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <div className="rec-priority">{rec.priority}</div>
                    <div className="rec-content">
                      <div className="rec-title">{rec.title}</div>
                      <div className="rec-description">{rec.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 