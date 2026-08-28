import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import CompleteProfileModal, { BrandLogo } from '../../components/common/CompleteProfileModal';

export const CitizenDashboard = () => {
  const { user, requestRecruitRights } = useAuthStore();
  const [activeTab, setActiveTab] = useState('feed');
  
  // Data States
  const [jobs, setJobs] = useState([]);
  const [hireMePosts, setHireMePosts] = useState([]);
  const [myPostsData, setMyPostsData] = useState({ posts: [], stats: { totalPosts: 0, totalInquiries: 0, totalViews: 0, totalLikes: 0 } });
  const [followData, setFollowData] = useState({ followers: [], following: [], followersCount: 0, followingCount: 0 });
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingRights, setSubmittingRights] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [uploadingDocAppId, setUploadingDocAppId] = useState(null);

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
        api.get(`/community/posts?search=${encodeURIComponent(search)}&roleCategory=${selectedCategory}`).catch(() => ({ data: { data: { posts: [] } } })),
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

  const handleToggleFollow = async (targetUserId) => {
    try {
      const res = await api.post(`/community/follow/${targetUserId}`);
      toast.success(res.data.data.isFollowing ? 'Following talent profile' : 'Unfollowed');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Follow action failed');
    }
  };

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

      toast.success('Your Hire-Me post is now live!');
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

      toast.success('Your work offer & contact details were sent directly to the talent!');
      setSelectedHirePost(null);
      setInquiryMessage('');
      setInquiryBudget('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setSendingInquiry(false);
    }
  };

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

  const handleUploadMissingFile = async (e, appId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingDocAppId(appId);
    try {
      await api.post(`/applications/${appId}/missing-doc`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Requested document uploaded and submitted!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDocAppId(null);
    }
  };

  const calculateProfileScore = () => {
    if (user?.isProfileComplete) return 100;
    let score = 20;
    if (user?.name) score += 15;
    if (user?.bio) score += 15;
    if (user?.skills?.length > 0) score += 20;
    if (user?.cvUrl) score += 15;
    if (user?.experience?.length > 0) score += 15;
    return Math.min(100, score);
  };

  const profileScore = calculateProfileScore();
  const sub = user?.subscription || {};
  const isPro = sub.plan === 'pro' || sub.plan === 'premium' || (sub.trialExpiresAt && new Date(sub.trialExpiresAt) > new Date());
  const activeCommunications = apps.filter(a => a.messages && a.messages.length > 0);

  if (loading) {
    return (
      <div className="page flex-center" style={{ minHeight: '300px' }}>
        <div className="animate-spin" style={{ fontSize: '1.8rem', color: 'var(--red)' }}>⟳</div>
        <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* Top Welcome Banner */}
      <div className="card glass" style={{
        padding: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid var(--glass-border)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Citizen & Professional Portal</div>
            <span style={{
              background: isPro ? 'rgba(225,29,72,0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isPro ? 'var(--red)' : 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              padding: '1px 8px',
              borderRadius: 'var(--r-full)',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              {isPro ? 'PRO CITIZEN' : 'STANDARD PASS'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: '4px 0 2px', fontWeight: 800 }}>Welcome, {user.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Publish daily Hire-Me gigs, browse corporate careers, grow your network, and manage direct employer inquiries.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowCreatePostModal(true)} 
            className="btn btn-primary"
            style={{ fontSize: '0.86rem', padding: '9px 16px' }}
          >
            Post Hire-Me Availability
          </button>

          <button 
            onClick={() => setIsProfileModalOpen(true)} 
            className="btn btn-secondary"
            style={{ fontSize: '0.86rem', padding: '9px 16px' }}
          >
            {profileScore < 100 ? 'Complete Profile (100%)' : 'Edit Profile'}
          </button>

          {user.recruitRights?.status === 'none' && (
            <button onClick={handleRequestRights} disabled={submittingRights} className="btn btn-ghost" style={{ border: '1px solid var(--glass-border)', fontSize: '0.82rem' }}>
              Request Recruiter Rights
            </button>
          )}
          {user.recruitRights?.status === 'approved' && (
            <Link to="/recruiter" className="btn btn-secondary" style={{ fontSize: '0.86rem' }}>
              Recruiter Hub
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', overflowX: 'auto' }}>
        {[
          { id: 'feed', label: 'Daily Jobs & Hire-Me Feed', count: hireMePosts.length },
          { id: 'official_jobs', label: 'Corporate Careers', count: jobs.length },
          { id: 'my_posts', label: `My Gigs & Inquiries (${myPostsData.posts?.length || 0})`, badge: myPostsData.stats?.totalInquiries },
          { id: 'network', label: `Network (${followData.followers?.length || 0} Followers)` },
          { id: 'applications', label: `My Applications (${apps.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--r-md)',
              border: `1px solid ${activeTab === tab.id ? 'var(--red-border)' : 'transparent'}`,
              background: activeTab === tab.id ? 'var(--red-subtle)' : 'transparent',
              color: activeTab === tab.id ? 'var(--red)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--t-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', fontSize: '0.68rem', padding: '1px 5px', borderRadius: 'var(--r-full)' }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: DAILY JOBS & HIRE-ME COMMUNITY FEED */}
      {activeTab === 'feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px' }} className="dashboard-grid">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '14px 18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '220px' }}>
                <input 
                  type="text" 
                  placeholder="Search skills, trades, roles (e.g. Electrician, React, Tutor)..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
              </form>

              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ width: '180px', fontSize: '0.82rem', padding: '8px 10px' }}
              >
                <option value="all">All Categories</option>
                <option value="software_dev">Software & Web</option>
                <option value="craft_daily_work">Trades & Daily Work</option>
                <option value="design_creative">Design & Creative</option>
                <option value="marketing_sales">Sales & Marketing</option>
                <option value="education_tutoring">Tutoring & Teaching</option>
                <option value="translation_writing">Writing & Translation</option>
                <option value="finance_business">Business & Finance</option>
              </select>
            </div>

            {hireMePosts.length === 0 ? (
              <div className="card flex-center" style={{ padding: '48px', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>No "Hire Me" posts found</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '380px', fontSize: '0.85rem' }}>
                  Be the first citizen in your field to publish your skills and get contacted by clients and employers!
                </p>
                <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary btn-sm">
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
                  <div key={post._id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {author.avatar ? (
                          <img 
                            src={author.avatar} 
                            alt={author.name} 
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
                            {author.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-primary)', fontWeight: 700 }}>{author.name}</h4>
                            <span style={{ fontSize: '0.7rem', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 'var(--r-full)', color: 'var(--text-muted)' }}>
                              {post.location?.city || 'Tunis'} {post.location?.isRemote ? '· Remote' : ''}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                            {author.headline || `${author.role?.toUpperCase()} · Available for hire`}
                          </p>
                        </div>
                      </div>

                      {!isMyPost && (
                        <button 
                          onClick={() => handleToggleFollow(author._id)} 
                          className={`btn ${isFollowingAuthor ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
                          style={{ fontSize: '0.76rem', padding: '5px 10px' }}
                        >
                          {isFollowingAuthor ? 'Following' : '+ Follow'}
                        </button>
                      )}
                    </div>

                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 6px', fontWeight: 700 }}>
                        {post.title}
                      </h4>
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {post.description}
                      </p>
                    </div>

                    {post.skills?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {post.skills.map((s, idx) => (
                          <span key={idx} style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: 'var(--r-full)', color: 'var(--text-primary)' }}>
                            #{s}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rate:</span>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {post.rate?.amount > 0 ? `${post.rate.amount} ${post.rate.currency} / ${post.rate.period}` : 'Negotiable'}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleToggleLike(post._id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: isLiked ? 'var(--red)' : 'var(--text-muted)', fontSize: '0.85rem' }}
                        >
                          <span>{isLiked ? '★' : '☆'}</span>
                          <span>{post.likes?.length || 0}</span>
                        </button>
                      </div>

                      {!isMyPost ? (
                        <button 
                          onClick={() => setSelectedHirePost(post)} 
                          className="btn btn-primary btn-sm"
                          style={{ padding: '7px 16px', fontSize: '0.8rem' }}
                        >
                          Send Work Offer
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                          {post.views || 0} views · {post.inquiries?.length || 0} inquiries
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Sidebar Widgets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Get Hired Directly</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Publish your skills, hourly or project rates, and get contacted by companies and citizens across Tunisia.
              </p>
              <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
                + Post Your Skills & Rate
              </button>
            </div>

            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Profile Strength</h4>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: profileScore === 100 ? '#10b981' : 'var(--red)' }}>{profileScore}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                <div style={{ width: `${profileScore}%`, height: '100%', background: profileScore === 100 ? '#10b981' : 'var(--red)', transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Complete your bio and CV to boost your visibility on all job feeds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CORPORATE CAREERS */}
      {activeTab === 'official_jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Corporate Career Openings</h3>
            <Link to="/jobs" className="btn btn-primary btn-sm">Explore All Jobs Board →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {jobs.map(j => (
              <div key={j._id} className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="logo-container" style={{ width: '44px', height: '44px', background: 'var(--bg-elevated)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--glass-border)' }}>
                    <BrandLogo logoUrl={j.companyLogo} name={j.title} company={j.company} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>🏢 {j.company} · {j.location}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, lineHeight: 1.5 }}>
                  {j.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                  <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{j.contractType}</span>
                  <Link to="/jobs" className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>Apply / View</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MY GIGS & INQUIRIES */}
      {activeTab === 'my_posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{myPostsData.stats?.totalPosts || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active Hire-Me Gigs</div>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{myPostsData.stats?.totalInquiries || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct Work Inquiries</div>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--red)' }}>{myPostsData.stats?.totalViews || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Client Views</div>
            </div>
            <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{myPostsData.stats?.totalLikes || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Community Likes</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Published Hire-Me Gigs</h3>
            <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary btn-sm">
              + Post New Availability
            </button>
          </div>

          {myPostsData.posts?.length === 0 ? (
            <div className="card flex-center" style={{ padding: '40px', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ margin: 0 }}>No Hire-Me listings published yet</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Post your skills to start receiving inquiries from clients.</p>
              <button onClick={() => setShowCreatePostModal(true)} className="btn btn-primary btn-sm">Create First Post</button>
            </div>
          ) : (
            myPostsData.posts.map(post => (
              <div key={post._id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{post.title}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Published {new Date(post.createdAt).toLocaleDateString()} · {post.views || 0} views · {post.likes?.length || 0} likes
                    </p>
                  </div>
                  <button onClick={() => handleDeletePost(post._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', fontSize: '0.76rem' }}>
                    Delete Post
                  </button>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>{post.description}</p>

                {/* Inquiries */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>
                    Received Client Inquiries ({post.inquiries?.length || 0})
                  </h4>

                  {post.inquiries?.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                      No inquiries received yet for this gig.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {post.inquiries.map((inq, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong>{inq.senderName} {inq.senderCompany ? `(${inq.senderCompany})` : ''}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(inq.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>"{inq.message}"</p>
                          <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            <span>Email: <a href={`mailto:${inq.senderEmail}`} style={{ color: 'var(--red)' }}>{inq.senderEmail}</a></span>
                            {inq.senderPhone && <span>Phone: {inq.senderPhone}</span>}
                            {inq.offeredBudget && <span>Budget: {inq.offeredBudget}</span>}
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

      {/* TAB 4: SOCIAL NETWORK */}
      {activeTab === 'network' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="dashboard-grid">
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Followers ({followData.followers?.length || 0})</h3>
            {followData.followers?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No followers yet.</p>
            ) : (
              followData.followers.map(f => (
                <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{f.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.headline || f.role}</div>
                  </div>
                  <button onClick={() => handleToggleFollow(f._id)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.74rem' }}>
                    {followData.following?.some(u => u._id === f._id) ? 'Mutual Follow' : '+ Follow Back'}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Following ({followData.following?.length || 0})</h3>
            {followData.following?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>You are not following anyone yet.</p>
            ) : (
              followData.following.map(f => (
                <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{f.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.headline || f.role}</div>
                  </div>
                  <button onClick={() => handleToggleFollow(f._id)} className="btn btn-ghost btn-sm" style={{ fontSize: '0.74rem', color: 'var(--red)' }}>
                    Unfollow
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MY APPLICATIONS & INTERACTIVE MESSAGES HUB */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Communications & Interview Hub */}
          {activeCommunications.length > 0 && (
            <div className="card glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--red-border)' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'var(--red)' }}>
                Interview Invitations & Employer Requests ({activeCommunications.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeCommunications.map(app => (
                  <div key={app._id} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem' }}>{app.targetId?.name || app.targetId?.title || 'Listing'}</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          Status: <strong style={{ textTransform: 'capitalize' }}>{app.status?.replace('_', ' ')}</strong>
                        </span>
                      </div>
                    </div>

                    {app.messages.map((m, idx) => (
                      <div key={idx} style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: '6px', fontSize: '0.82rem', marginTop: '4px' }}>
                        <div style={{ fontWeight: 600, color: m.sender === 'institution' ? 'var(--red)' : '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{m.senderName || m.sender}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ margin: '4px 0 6px', color: 'var(--text-secondary)' }}>{m.message}</p>

                        {/* Interview Details */}
                        {m.type === 'meeting_booking' && m.meetingDetails && (
                          <div style={{ padding: '8px 12px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: '6px', marginTop: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#60a5fa' }}>Scheduled Interview</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                              Date: <strong>{new Date(m.meetingDetails.date).toLocaleDateString()}</strong> at <strong>{m.meetingDetails.time}</strong>
                            </div>
                            {m.meetingDetails.link && (
                              <a href={m.meetingDetails.link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: '6px', fontSize: '0.76rem', display: 'inline-block' }}>
                                Join Meeting Link ↗
                              </a>
                            )}
                          </div>
                        )}

                        {/* Missing Doc Request */}
                        {m.type === 'file_request' && (
                          <div style={{ padding: '8px 12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '6px', marginTop: '6px' }}>
                            <div style={{ fontWeight: 600, color: '#fbbf24' }}>
                              Requested Document: {m.missingDocType}
                            </div>
                            {m.uploadedDocUrl ? (
                              <div style={{ fontSize: '0.76rem', color: '#10b981', marginTop: '4px' }}>
                                ✓ Document uploaded and delivered
                              </div>
                            ) : (
                              <div style={{ marginTop: '8px' }}>
                                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', fontSize: '0.76rem' }}>
                                  {uploadingDocAppId === app._id ? 'Uploading...' : 'Upload & Submit Missing Document'}
                                  <input 
                                    type="file" 
                                    accept=".pdf,image/*,.doc,.docx" 
                                    onChange={e => handleUploadMissingFile(e, app._id)} 
                                    style={{ display: 'none' }} 
                                    disabled={uploadingDocAppId === app._id}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications list */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>Submitted Applications History</h3>
            {apps.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px', fontSize: '0.85rem' }}>You have not submitted any applications yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {apps.map(a => (
                  <div key={a._id} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{a.targetId?.title || a.targetId?.name || 'Listing Opportunity'}</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Applied on {new Date(a.createdAt).toLocaleDateString()} · Type: {a.targetModel}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--r-full)',
                        textTransform: 'uppercase',
                        background: a.status === 'accepted' ? 'rgba(52, 211, 153, 0.15)' : a.status === 'rejected' ? 'rgba(225, 29, 72, 0.15)' : a.status === 'under_review' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                        color: a.status === 'accepted' ? '#10b981' : a.status === 'rejected' ? 'var(--red)' : a.status === 'under_review' ? '#60a5fa' : '#fbbf24',
                      }}>
                        {a.status?.replace('_', ' ')}
                      </span>
                      <button
                        onClick={async () => {
                          if (window.confirm('Withdraw this application?')) {
                            try {
                              await api.delete(`/applications/${a._id}`);
                              setApps(apps.filter(appItem => appItem._id !== a._id));
                              toast.success('Application withdrawn successfully');
                            } catch (err) {
                              toast.error('Failed to remove application');
                            }
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE HIRE ME MODAL */}
      {showCreatePostModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowCreatePostModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Talent Showcase</div>
                <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', fontWeight: 700 }}>Publish "Hire Me" Availability</h3>
              </div>
              <button onClick={() => setShowCreatePostModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreatePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Role Title / Service *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior Full Stack Developer, Certified Electrician, French Tutor..."
                  value={postTitle} 
                  onChange={e => setPostTitle(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={roleCategory} onChange={e => setRoleCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                    <option value="software_dev">Software & Web</option>
                    <option value="craft_daily_work">Trades & Daily Work</option>
                    <option value="design_creative">Design & Multimedia</option>
                    <option value="marketing_sales">Sales & Marketing</option>
                    <option value="education_tutoring">Tutoring & Teaching</option>
                    <option value="translation_writing">Writing & Translation</option>
                    <option value="finance_business">Finance & Business</option>
                    <option value="other">Other Services</option>
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
                <label className="form-label">Description & Capabilities *</label>
                <textarea 
                  rows="3" 
                  placeholder="Describe your capabilities, previous work, or types of projects you take on..." 
                  value={postDescription} 
                  onChange={e => setPostDescription(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  <select value={postRatePeriod} onChange={e => setPostRatePeriod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}>
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                    <option value="project">Per Project / Task</option>
                    <option value="month">Monthly Retainer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  <label htmlFor="remoteCheck" style={{ fontSize: '0.82rem', cursor: 'pointer', margin: 0 }}>Remote tasks OK</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreatePostModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={creatingPost} className="btn btn-primary">
                  {creatingPost ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND INQUIRY MODAL */}
      {selectedHirePost && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedHirePost(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div className="section-label" style={{ fontSize: '0.65rem' }}>Direct Work Offer</div>
                <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', fontWeight: 700 }}>Contact {selectedHirePost.authorId?.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>For: "{selectedHirePost.title}"</p>
              </div>
              <button onClick={() => setSelectedHirePost(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSendInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input type="text" value={inquiryName} onChange={e => setInquiryName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Company / Entity</label>
                  <input type="text" value={inquiryCompany} onChange={e => setInquiryCompany(e.target.value)} placeholder="e.g. Freelancer, Startup" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Your Email *</label>
                  <input type="email" value={inquiryEmail} onChange={e => setInquiryEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" value={inquiryPhone} onChange={e => setInquiryPhone(e.target.value)} placeholder="+216 21 000 000" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Brief / Job Offer *</label>
                <textarea 
                  rows="3" 
                  placeholder="Explain the job, task requirements, timeline, and how you want to collaborate..." 
                  value={inquiryMessage} 
                  onChange={e => setInquiryMessage(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Offered Budget / Terms</label>
                <input 
                  type="text" 
                  placeholder="e.g. 500 TND for 3 days of work" 
                  value={inquiryBudget} 
                  onChange={e => setInquiryBudget(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setSelectedHirePost(null)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={sendingInquiry} className="btn btn-primary">
                  {sendingInquiry ? 'Sending...' : 'Send Work Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Profile Modal */}
      <CompleteProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => { setIsProfileModalOpen(false); fetchDashboardData(); }} 
      />
    </div>
  );
};

export default CitizenDashboard;
