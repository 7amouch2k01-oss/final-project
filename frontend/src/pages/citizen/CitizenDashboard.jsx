import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import CompleteProfileModal from '../../components/common/CompleteProfileModal';

export const CitizenDashboard = () => {
  const { user, requestRecruitRights } = useAuthStore();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' (all hire-me + official jobs), 'my_posts' (creator hub & inquiries), 'applications', 'network' (following & followers)
  
  // Data States
  const [jobs, setJobs] = useState([]);
  const [hireMePosts, setHireMePosts] = useState([]);
  const [myPostsData, setMyPostsData] = useState({ posts: [], stats: { totalPosts: 0, totalInquiries: 0, totalViews: 0, totalLikes: 0 } });
  const [followData, setFollowData] = useState({ followers: [], following: [], followersCount: 0, followingCount: 0 });
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingRights, setSubmittingRights] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // New Hire-Me Post Modal Form
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [roleCategory, setRoleCategory] = useState('software_dev');
  const [postSkills, setPostSkills] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postRateAmount, setPostRateAmount] = useState(50);
  const [postRatePeriod, setPostRatePeriod] = useState('day');
  const [postCity, setPostCity] = useState('Tunis');
  const [postIsRemote, setPostIsRemote] = useState(true);
  const [postPhone, setPostPhone] = useState('');
  const [postWhatsapp, setPostWhatsapp] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  // Send Hire / Inquiry Modal
  const [selectedHirePost, setSelectedHirePost] = useState(null);
  const [inquiryName, setInquiryName] = useState(user?.name || '');
  const [inquiryEmail, setInquiryEmail] = useState(user?.email || '');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryCompany, setInquiryCompany] = useState(user?.company?.name || '');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryBudget, setInquiryBudget] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [jobRes, postsRes, myPostsRes, followRes, appRes] = await Promise.all([
        api.get('/jobs?limit=6').catch(() => ({ data: { data: { jobs: [] } } })),
        api.get(`/community/posts?search=${search}&roleCategory=${selectedCategory}`).catch(() => ({ data: { data: { posts: [] } } })),
        api.get('/community/my-posts').catch(() => ({ data: { data: { posts: [], stats: {} } } })),
        api.get('/community/follow-data').catch(() => ({ data: { data: { followers: [], following: [] } } })),
        api.get('/applications/mine').catch(() => ({ data: { data: { applications: [] } } })),
      ]);

      setJobs(jobRes.data.data.jobs || []);
      setHireMePosts(postsRes.data.data.posts || []);
      setMyPostsData(myPostsRes.data.data || { posts: [], stats: {} });
      setFollowData(followRes.data.data || { followers: [], following: [] });
      setApps(appRes.data.data.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleRequestRights = async () => {
    setSubmittingRights(true);
    const res = await requestRecruitRights();
    setSubmittingRights(false);
    if (res.success) {
      toast.success('Recruit rights requested! Awaiting admin approval.');
    } else {
      toast.error(res.error || 'Failed to request rights');
    }
  };

  // Follow / Unfollow user
  const handleToggleFollow = async (targetUserId) => {
    try {
      const res = await api.post(`/community/follow/${targetUserId}`);
      toast.success(res.data.data.isFollowing ? '✓ Following talent profile' : 'Unfollowed');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Follow action failed');
    }
  };

  // Toggle Like on post
  const handleToggleLike = async (postId) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      setHireMePosts(prev => prev.map(p => {
        if (p._id === postId) {
          const isLiked = res.data.data.isLiked;
          const likes = isLiked ? [...p.likes, user._id] : p.likes.filter(id => id !== user._id);
          return { ...p, likes };
        }
        return p;
      }));
    } catch (err) {
      toast.error('Failed to like post');
    }
  };

  // Submit new Hire-Me Post
  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postDescription.trim()) return;

    setCreatingPost(true);
    try {
      await api.post('/community/posts', {
        title: postTitle.trim(),
        roleCategory,
        skills: postSkills,
        description: postDescription.trim(),
        rate: {
          amount: Number(postRateAmount) || 0,
          currency: 'TND',
          period: postRatePeriod,
          isNegotiable: true,
        },
        location: {
          city: postCity,
          country: 'Tunisia',
          isRemote: postIsRemote,
        },
        contactInfo: {
          email: user?.email,
          phone: postPhone,
          whatsapp: postWhatsapp,
        },
      });

      toast.success('Your Hire-Me post is now live across TuniJob! 🚀');
      setShowCreatePostModal(false);
      setPostTitle('');
      setPostDescription('');
      setPostSkills('');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setCreatingPost(false);
    }
  };

  // Submit Inquiry / Hire Offer
  const handleSendInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryMessage.trim() || !selectedHirePost) return;

    setSendingInquiry(true);
    try {
      await api.post(`/community/posts/${selectedHirePost._id}/inquiry`, {
        name: inquiryName,
        email: inquiryEmail,
        phone: inquiryPhone,
        company: inquiryCompany,
        message: inquiryMessage,
        offeredBudget: inquiryBudget,
      });

      toast.success('Your work offer & contact details were sent directly to the talent! 📬');
      setSelectedHirePost(null);
      setInquiryMessage('');
      setInquiryBudget('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setSendingInquiry(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this Hire-Me post?')) return;
    try {
      await api.delete(`/community/posts/${postId}`);
      toast.success('Post removed');
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to remove post');
    }
  };

  // Profile completion score
  const calculateProfileScore = () => {
    let score = 25;
    if (user?.name) score += 15;
    if (user?.bio) score += 20;
    if (user?.skills?.length > 0) score += 15;
    if (user?.experience?.length > 0) score += 15;
    if (user?.company?.name || user?.cvUrl) score += 10;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileScore();
  const sub = user?.subscription || {};
  const isPro = sub.plan === 'pro' || sub.plan === 'premium' || (sub.trialExpiresAt && new Date(sub.trialExpiresAt) > new Date());

  if (loading) {
    return (
      <div className="page flex-center" style={{ minHeight: '300px' }}>
        <div className="animate-spin" style={{ fontSize: '2.5rem', color: 'var(--red)' }}>⟳</div>
        <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading your citizen portal...</span>
      </div>
    );
  }

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* ── Top Hero Welcome Banner ─────────────────────────────────── */}
      <div className="card glass" style={{
        padding: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid var(--glass-border)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="section-label" style={{ marginBottom: 0 }}>TuniJob Citizen & Professional Portal</div>
            <span style={{
              background: isPro ? 'rgba(225,29,72,0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isPro ? 'var(--red-bright)' : 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              padding: '2px 10px',
              borderRadius: 'var(--r-full)',
              fontSize: '0.74rem',
              fontWeight: 700
            }}>
              {isPro ? '★ PRO CITIZEN' : '○ STANDARD PASS'}
            </span>
          </div>
          <h2 style={{ fontSize: '2rem', margin: '4px 0 2px' }}>Welcome, {user.name} 👋</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Publish daily "Hire-Me" gigs, browse official careers, grow your follower network, and receive direct employment offers.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowCreatePostModal(true)} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📢</span> Post "Hire Me" Availability
          </button>

          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>📝</span> Edit Profile
          </button>

          {user.recruitRights?.status === 'none' && (
            <button onClick={handleRequestRights} disabled={submittingRights} className="btn btn-ghost" style={{ border: '1px solid var(--glass-border)' }}>
              🏢 Request Recruiter Mode
            </button>
          )}
          {user.recruitRights?.status === 'approved' && (
            <Link to="/recruiter" className="btn btn-secondary">
              💼 Recruiter Hub
            </Link>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', overflowX: 'auto' }}>
        {[
          { id: 'feed', label: '🔥 Daily Jobs & Hire-Me Feed', count: hireMePosts.length },
          { id: 'official_jobs', label: '💼 Official Corporate Careers', count: jobs.length },
          { id: 'my_posts', label: `📊 My Gigs & Inquiries (${myPostsData.posts?.length || 0})`, badge: myPostsData.stats?.totalInquiries },
          { id: 'network', label: `👥 Social Network (${followData.followers?.length || 0} Followers)` },
          { id: 'applications', label: `📄 My Applications (${apps.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--r-md)',
              border: `1px solid ${activeTab === tab.id ? 'var(--red-border)' : 'transparent'}`,
              background: activeTab === tab.id ? 'var(--red-subtle)' : 'transparent',
              color: activeTab === tab.id ? 'var(--red-bright)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all var(--t-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════ TAB 1: DAILY JOBS & HIRE-ME COMMUNITY FEED ════ */}
      {activeTab === 'feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '32px' }} className="dashboard-grid">
          
          {/* Main Feed Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Search & Category Filter */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '240px' }}>
                <input 
                  type="text" 
                  placeholder="Search skills, trades, roles (e.g. Electrician, React, Tutor)..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
              </form>

              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ width: '200px', fontSize: '0.85rem' }}
              >
                <option value="all">All Categories</option>
                <option value="software_dev">💻 Software & Web</option>
                <option value="craft_daily_work">🔧 Daily Work & Trades</option>
                <option value="design_creative">🎨 Design & Creative</option>
                <option value="marketing_sales">📈 Sales & Marketing</option>
                <option value="education_tutoring">📚 Tutoring & Teaching</option>
                <option value="translation_writing">✍️ Writing & Translation</option>
                <option value="finance_business">💼 Business & Accounting</option>
              </select>
            </div>

            {/* Posts Grid */}
            {hireMePosts.length === 0 ? (
              <div className="card flex-center" style={{ padding: '60px', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>📢</span>
                <h3>No "Hire Me" posts found</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
                  Be the first citizen in your field to publish your skills and get contacted by clients and employers!
                </p>
                <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary">
                  + Create Your "Hire Me" Post
                </button>
              </div>
            ) : (
              hireMePosts.map(post => {
                const author = post.authorId || {};
                const isMyPost = author._id === user._id;
                const isFollowingAuthor = followData.following?.some(u => u._id === author._id);
                const isLiked = post.likes?.includes(user._id);

                return (
                  <div key={post._id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Post Author Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        {author.avatar ? (
                          <img 
                            src={author.avatar} 
                            alt={author.name} 
                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                            {author.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{author.name}</h4>
                            <span style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--r-full)', color: 'var(--text-muted)' }}>
                              📍 {post.location?.city || 'Tunis'} {post.location?.isRemote ? '• Remote OK' : ''}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                            {author.headline || `${author.role?.toUpperCase()} • Available for hire`}
                          </p>
                        </div>
                      </div>

                      {/* Follow Button */}
                      {!isMyPost && (
                        <button 
                          onClick={() => handleToggleFollow(author._id)} 
                          className={`btn ${isFollowingAuthor ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          {isFollowingAuthor ? '✓ Following' : '+ Follow'}
                        </button>
                      )}
                    </div>

                    {/* Post Title & Description */}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {post.title}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                        {post.description}
                      </p>
                    </div>

                    {/* Skills Tags */}
                    {post.skills?.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {post.skills.map((s, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', padding: '3px 10px', borderRadius: 'var(--r-full)', color: 'var(--text-primary)' }}>
                            #{s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rate & Actions Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rate / Expectation:</span>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                            {post.rate?.amount > 0 ? `${post.rate.amount} ${post.rate.currency} / ${post.rate.period}` : 'Negotiable rate'}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleToggleLike(post._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: isLiked ? 'var(--red)' : 'var(--text-muted)', fontSize: '0.9rem' }}
                        >
                          <span>{isLiked ? '❤️' : '🤍'}</span>
                          <span>{post.likes?.length || 0}</span>
                        </button>
                      </div>

                      {/* Contact / Hire button */}
                      {!isMyPost ? (
                        <button 
                          onClick={() => setSelectedHirePost(post)} 
                          className="btn btn-primary btn-sm"
                          style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <span>💼</span> Hire / Send Work Offer
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          👀 {post.views || 0} views • 📬 {post.inquiries?.length || 0} inquiries received
                        </span>
                      )}
                    </div>

                  </div>
                );
              })
            )}

          </div>

          {/* Right Sidebar Widgets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Creator Widget */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ margin: 0 }}>🌟 Stand Out to Clients</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                Whether you are a developer, designer, electrician, tutor, or accountant, let companies and citizens find you directly.
              </p>
              <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                + Post Your Skills & Rates
              </button>
            </div>

            {/* Profile Strength */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Profile Strength</h4>
                <span className="badge badge-accent">{profileScore}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--grey-200)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                <div style={{ width: `${profileScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--red), var(--red-hover))', transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Complete your bio and CV to receive 3x more inquiries on your Hire-Me posts.
              </p>
            </div>

            {/* Network Summary */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ margin: 0 }}>👥 Your Network</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{followData.followers?.length || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Followers</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{followData.following?.length || 0}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Following</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ════ TAB 2: OFFICIAL CORPORATE CAREERS ════ */}
      {activeTab === 'official_jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Official Corporate Career Openings</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>CDI, CDD, Freelance, and Remote positions posted by verified Tunisian companies.</p>
            </div>
            <Link to="/jobs" className="btn btn-primary btn-sm">Explore All Jobs Board →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {jobs.map(j => (
              <div key={j._id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {j.companyLogo ? (
                    <img src={j.companyLogo} alt={j.company} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : null}
                  <div style={{ width: '48px', height: '48px', background: 'var(--bg-elevated)', borderRadius: '8px', display: j.companyLogo ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {j.company?.[0]?.toUpperCase() || '🏢'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{j.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏢 {j.company} • 📍 {j.location}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {j.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>⏱️ {j.contractType}</span>
                  <Link to="/jobs" className="btn btn-secondary btn-sm">Apply / View</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ TAB 3: MY GIGS & INQUIRIES DASHBOARD ════ */}
      {activeTab === 'my_posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Interaction Overview Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{myPostsData.stats?.totalPosts || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Hire-Me Gigs</div>
            </div>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{myPostsData.stats?.totalInquiries || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Direct Work Inquiries / Leads</div>
            </div>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--red)' }}>{myPostsData.stats?.totalViews || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Client Views</div>
            </div>
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{myPostsData.stats?.totalLikes || 0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Community Likes & Endorsements</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Your Published Hire-Me Gigs & Client Offers</h3>
            <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary btn-sm">
              + Post New Availability
            </button>
          </div>

          {myPostsData.posts?.length === 0 ? (
            <div className="card flex-center" style={{ padding: '48px', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '2.5rem' }}>📭</span>
              <h4>You haven't posted any Hire-Me listings yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Post what you can do (skills, rate, availability) to start receiving client contacts.</p>
              <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary">Create First Post</button>
            </div>
          ) : (
            myPostsData.posts.map(post => (
              <div key={post._id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{post.title}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Published on {new Date(post.createdAt).toLocaleDateString()} • {post.views || 0} views • {post.likes?.length || 0} likes
                    </p>
                  </div>
                  <button onClick={() => handleDeletePost(post._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', border: '1px solid var(--red-border)' }}>
                    🗑️ Delete Post
                  </button>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{post.description}</p>

                {/* Received Inquiries / Client Contact Leads */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
                    📬 Received Client Inquiries ({post.inquiries?.length || 0})
                  </h4>

                  {post.inquiries?.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      No inquiries received yet for this gig. Share your profile link to get discovered!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {post.inquiries.map((inq, idx) => (
                        <div key={idx} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              👤 {inq.senderName} {inq.senderCompany ? `(${inq.senderCompany})` : ''}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {new Date(inq.createdAt).toLocaleDateString()} {new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: '6px 0', lineHeight: 1.5 }}>
                            "{inq.message}"
                          </p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', flexWrap: 'wrap' }}>
                            <span>📧 <a href={`mailto:${inq.senderEmail}`} style={{ color: 'var(--red-bright)' }}>{inq.senderEmail}</a></span>
                            {inq.senderPhone && <span>📞 <a href={`tel:${inq.senderPhone}`} style={{ color: 'var(--red-bright)' }}>{inq.senderPhone}</a></span>}
                            {inq.offeredBudget && <span>💵 Budget: <strong>{inq.offeredBudget}</strong></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════ TAB 4: SOCIAL NETWORK (FOLLOWERS & FOLLOWING) ════ */}
      {activeTab === 'network' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="dashboard-grid">
          
          {/* Followers List */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>👥 Who Followed You</h3>
              <span className="badge badge-accent">{followData.followers?.length || 0}</span>
            </div>
            
            {followData.followers?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No followers yet. Post engaging gigs to grow your audience!</p>
            ) : (
              followData.followers.map(f => (
                <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {f.avatar ? (
                      <img src={f.avatar} alt={f.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {f.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{f.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.headline || `${f.role} on TuniStudy/TuniJob`}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleToggleFollow(f._id)} 
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    {followData.following?.some(u => u._id === f._id) ? '✓ Mutual Follow' : '+ Follow Back'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Following List */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>🌟 Talents & Recruiters You Follow</h3>
              <span className="badge badge-accent">{followData.following?.length || 0}</span>
            </div>

            {followData.following?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>You are not following anyone yet. Explore the Hire-Me feed to connect with talents!</p>
            ) : (
              followData.following.map(f => (
                <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {f.avatar ? (
                      <img src={f.avatar} alt={f.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {f.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{f.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.headline || `${f.role} on TuniJob`}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleToggleFollow(f._id)} 
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', color: 'var(--red)' }}
                  >
                    Unfollow
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ════ TAB 5: MY APPLICATIONS ════ */}
      {activeTab === 'applications' && (
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3>Submitted Applications History</h3>
          {apps.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px' }}>You have not submitted any job or stage applications yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {apps.map(a => (
                <div key={a._id} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{a.targetId?.title || a.targetId?.name || 'Listing Opportunity'}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Applied on {new Date(a.createdAt).toLocaleDateString()} • Type: {a.targetType || a.targetModel}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`status-${a.status}`}>
                      {a.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={async () => {
                        if (window.confirm('Withdraw and remove this application?')) {
                          try {
                            await api.delete(`/applications/${a._id}`);
                            setApps(apps.filter(appItem => appItem._id !== a._id));
                            toast.success('Application withdrawn successfully');
                          } catch (err) {
                            toast.error('Failed to remove application');
                          }
                        }
                      }}
                      className="btn btn-ghost btn-sm"
                      title="Withdraw application"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE "HIRE ME" POST ───────────────────────────── */}
      {showCreatePostModal && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Community Talent Showcase</div>
                <h3 style={{ fontSize: '1.4rem', marginTop: '4px' }}>Publish Your "Hire Me" Gig</h3>
              </div>
              <button onClick={() => setShowCreatePostModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreatePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Role Title / What can you do? *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior React & Node.js Developer, Certified Electrician, French Tutor..."
                  value={postTitle} 
                  onChange={e => setPostTitle(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={roleCategory} onChange={e => setRoleCategory(e.target.value)}>
                    <option value="software_dev">💻 Software & Web</option>
                    <option value="craft_daily_work">🔧 Daily Work & Trades</option>
                    <option value="design_creative">🎨 Design & Multimedia</option>
                    <option value="marketing_sales">📈 Sales & Marketing</option>
                    <option value="education_tutoring">📚 Tutoring & Teaching</option>
                    <option value="translation_writing">✍️ Writing & Translation</option>
                    <option value="finance_business">💼 Finance & Business</option>
                    <option value="other">⚡ Other Services</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location (City)</label>
                  <input type="text" value={postCity} onChange={e => setPostCity(e.target.value)} placeholder="Tunis, Sousse, Sfax..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Key Skills / Tools (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="React, TypeScript, Electrical wiring, Math, Figma..." 
                  value={postSkills} 
                  onChange={e => setPostSkills(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Pitch & Experience *</label>
                <textarea 
                  rows="4" 
                  placeholder="Describe your capabilities, previous projects, equipment, or what kind of jobs you are looking to take on..." 
                  value={postDescription} 
                  onChange={e => setPostDescription(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Expected Rate (TND)</label>
                  <input 
                    type="number" 
                    value={postRateAmount} 
                    onChange={e => setPostRateAmount(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Period / Unit</label>
                  <select value={postRatePeriod} onChange={e => setPostRatePeriod(e.target.value)}>
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                    <option value="project">Per Project / Task</option>
                    <option value="month">Monthly Retainer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone / WhatsApp</label>
                  <input type="tel" value={postPhone} onChange={e => setPostPhone(e.target.value)} placeholder="+216 98 000 000" />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                  <input 
                    type="checkbox" 
                    id="remoteCheck" 
                    checked={postIsRemote} 
                    onChange={e => setPostIsRemote(e.target.checked)} 
                  />
                  <label htmlFor="remoteCheck" style={{ fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>Available for Remote tasks</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCreatePostModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={creatingPost} className="btn btn-primary">
                  {creatingPost ? 'Publishing...' : 'Publish Post 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: SEND WORK OFFER / INQUIRY TO TALENT ──────────────── */}
      {selectedHirePost && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Direct Hire Offer</div>
                <h3 style={{ fontSize: '1.35rem', marginTop: '4px' }}>Contact {selectedHirePost.authorId?.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>For: "{selectedHirePost.title}"</p>
              </div>
              <button onClick={() => setSelectedHirePost(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSendInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input type="text" value={inquiryName} onChange={e => setInquiryName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Company / Entity</label>
                  <input type="text" value={inquiryCompany} onChange={e => setInquiryCompany(e.target.value)} placeholder="e.g. Freelancer, Startup, Personal" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Your Email *</label>
                  <input type="email" value={inquiryEmail} onChange={e => setInquiryEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Phone Number</label>
                  <input type="tel" value={inquiryPhone} onChange={e => setInquiryPhone(e.target.value)} placeholder="+216 21 000 000" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Brief / Job Offer Message *</label>
                <textarea 
                  rows="4" 
                  placeholder="Explain the job, task requirements, timeline, and how you want to collaborate..." 
                  value={inquiryMessage} 
                  onChange={e => setInquiryMessage(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Offered Budget / Terms (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 500 TND for 3 days of work" 
                  value={inquiryBudget} 
                  onChange={e => setInquiryBudget(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedHirePost(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={sendingInquiry} className="btn btn-primary">
                  {sendingInquiry ? 'Sending...' : 'Send Work Offer 💼'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Profile Modal */}
      <CompleteProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};

export default CitizenDashboard;
