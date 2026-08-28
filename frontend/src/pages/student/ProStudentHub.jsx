import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export const ProStudentHub = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'calculator', 'advisor'

  // Subscriptions / Trial Status
  const sub = user?.subscription || {};
  const isTrialActive = sub.trialExpiresAt && new Date(sub.trialExpiresAt) > new Date();
  const isPaidPro = sub.plan === 'pro' || sub.plan === 'premium' || sub.plan === 'business';
  const unlocked = sub.unlockedFeatures || [];
  const hasAccessToAll = isPaidPro || isTrialActive || unlocked.includes('all');
  const hasTasksAccess = hasAccessToAll || unlocked.includes('tasks');
  const hasCalcAccess = hasAccessToAll || unlocked.includes('calculator');
  const hasAdvisorAccess = hasAccessToAll || unlocked.includes('advisor');

  // Modal Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('all'); // 'all', 'advisor', 'tasks', 'calculator'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('d17'); // 'd17', 'flouci', 'carte_bancaire', 'international'
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activatingTrial, setActivatingTrial] = useState(false);

  // Payment Form Fields
  const [phoneD17, setPhoneD17] = useState('');
  const [flouciAccount, setFlouciAccount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // ── Tasks State ──────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('exam');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // ── Calculator State ─────────────────────────────────────────
  const [calcType, setCalcType] = useState('bac_formula'); // 'bac_formula', 'university_gpa'
  const [bacData, setBacData] = useState({
    section: user?.baccalaureate?.section || 'Sciences de l\'Informatique',
    mg: 14.5,
    math: 15,
    sp: 13.5,
    svt: 12,
    tec: 14,
    eco: 12,
    gest: 13,
    info: 17,
    algo: 16,
    bd: 17,
    fr: 14,
    ang: 16,
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // University Modules Calculator
  const [uniModules, setUniModules] = useState([
    { name: 'Algorithmique & Structures de Données', grade: 14.5, coef: 3, credit: 6 },
    { name: 'Bases de Données & SQL', grade: 16, coef: 2.5, credit: 5 },
    { name: 'Systèmes d\'Exploitation & Linux', grade: 13, coef: 2, credit: 4 },
    { name: 'Mathématiques pour l\'Ingénieur', grade: 11.5, coef: 2.5, credit: 5 },
    { name: 'Anglais & Communication', grade: 15, coef: 1.5, credit: 3 },
  ]);

  // ── AI Advisor State ─────────────────────────────────────────
  const [aiChat, setAiChat] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.name?.split(' ')[0] || 'Student'}! I am your **TuniVerse Pro AI Academic & Career Advisor**.\n\nI can help you evaluate university opportunities (INSAT, ESPRIT, TBS, ENIT, etc.), advise you on PFE internships in Tunisia, or calculate your chances for engineering majors. How can I guide you today?`,
      recommendations: ['What are the requirements for INSAT MPI?', 'Which university is best for AI in Tunisia?', 'How to prepare for a PFE internship at top tech companies?'],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (hasTasksAccess) {
      fetchTasks();
    }
  }, [hasTasksAccess]);

  // ── Free Trial Activation ────────────────────────────────────
  const handleStartFreeTrial = async () => {
    setActivatingTrial(true);
    try {
      const res = await api.post('/pro/student/trial');
      if (user) {
        setUser({
          ...user,
          subscription: {
            ...user.subscription,
            plan: 'pro',
            trialUsed: true,
            trialExpiresAt: res.data.data.trialExpiresAt,
            unlockedFeatures: ['all'],
          },
        });
      }
      toast.success('1-Day Free Trial Activated! All Pro Features Unlocked.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate free trial');
    } finally {
      setActivatingTrial(false);
    }
  };

  // ── Purchase Handler ─────────────────────────────────────────
  const handleProcessPurchase = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    try {
      const res = await api.post('/pro/student/purchase', {
        packageType: selectedPackage,
        paymentMethod: selectedPaymentMethod,
        paymentDetails: {
          phone: phoneD17,
          flouciAccount,
          cardNumber: cardNumber ? `**** **** **** ${cardNumber.slice(-4)}` : undefined,
        },
      });

      if (user) {
        setUser({
          ...user,
          subscription: {
            ...user.subscription,
            plan: 'pro',
            unlockedFeatures: res.data.data.unlockedFeatures,
            paymentMethod: selectedPaymentMethod,
            expiresAt: res.data.data.expiresAt,
          },
        });
      }

      toast.success('Payment successful! Your chosen features are active.');
      setShowCheckoutModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  // ── Task Handlers ────────────────────────────────────────────
  const fetchTasks = async () => {
    setTaskLoading(true);
    try {
      const res = await api.get('/pro/student/tasks');
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await api.post('/pro/student/tasks', {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        category: newTaskCategory,
        priority: newTaskPriority,
        dueDate: newTaskDue || undefined,
      });
      setTasks([res.data.data.task, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowAddTaskModal(false);
      toast.success('Task scheduled in your Pro board!');
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'completed';
    try {
      const res = await api.patch(`/pro/student/tasks/${task._id}`, { status: nextStatus });
      setTasks(tasks.map(t => t._id === task._id ? res.data.data.task : t));
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/pro/student/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success('Task removed');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // ── Calculator Handlers ──────────────────────────────────────
  const handleCalculateBac = async (e) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const res = await api.post('/pro/student/calculate-score', {
        type: 'bac_formula',
        data: bacData,
      });
      setCalcResult(res.data.data);
      toast.success('Formule Globale (FG) calculated!');
    } catch (err) {
      toast.error('Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculateUniGPA = async () => {
    setCalculating(true);
    try {
      const res = await api.post('/pro/student/calculate-score', {
        type: 'university_gpa',
        data: { modules: uniModules },
      });
      setCalcResult(res.data.data);
      toast.success('University Semester Moyenne computed!');
    } catch (err) {
      toast.error('Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleAddModule = () => {
    setUniModules([...uniModules, { name: `Module ${uniModules.length + 1}`, grade: 12, coef: 2, credit: 4 }]);
  };

  const handleRemoveModule = (index) => {
    setUniModules(uniModules.filter((_, i) => i !== index));
  };

  const handleModuleChange = (index, field, value) => {
    const updated = [...uniModules];
    updated[index][field] = value;
    setUniModules(updated);
  };

  // ── AI Advisor Handlers ──────────────────────────────────────
  const handleSendAiMessage = async (textToSend) => {
    const query = textToSend || aiInput;
    if (!query.trim() || aiLoading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiChat(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await api.post('/pro/student/ai-advisor', {
        message: query,
      });
      const aiData = res.data.data;

      setAiChat(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiData.reply,
          recommendations: aiData.recommendations || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      toast.error('AI Advisor service encountered an error');
    } finally {
      setAiLoading(false);
    }
  };

  // Packages list
  const packages = [
    { id: 'all', name: 'Full Academic Pro Bundle', priceTND: 19, priceUSD: 6.99, period: '1 Year Pass', desc: 'Complete access to AI Advisor, Score Calculator, and Pro Task Manager Kanban.' },
    { id: 'advisor', name: 'AI Career Advisor Only', priceTND: 8, priceUSD: 2.99, period: '1 Year Pass', desc: 'Unlimited guidance for INSAT, ESPRIT, TBS, and Tunisian tech internships.' },
    { id: 'calculator', name: 'Score & GPA Calculator Only', priceTND: 6, priceUSD: 1.99, period: '1 Year Pass', desc: 'Tunisian Baccalaureate Formule Globale (FG) & Semester Moyenne computation.' },
    { id: 'tasks', name: 'Task & Milestone Manager Only', priceTND: 6, priceUSD: 1.99, period: '1 Year Pass', desc: 'Track university exams, revisions, and application deadlines.' },
  ];

  return (
    <div className="page container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
      
      {/* ── Top Pro Hero Banner ──────────────────────────────────────── */}
      <div className="card glass" style={{
        padding: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--bg-base)', fontWeight: 800, fontSize: '1.4rem',
            fontFamily: 'var(--font-display)',
            border: '1px solid var(--glass-border)'
          }}>
            PRO
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="section-label" style={{ marginBottom: 0, color: 'var(--text-primary)' }}>TuniVerse Pro Academic Workspace</div>
              <span style={{
                background: hasAccessToAll ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                padding: '2px 10px',
                borderRadius: 'var(--r-full)',
                fontSize: '0.74rem',
                fontWeight: 700
              }}>
                {isPaidPro ? '● PRO PASS ACTIVE' : isTrialActive ? '● 24H FREE TRIAL ACTIVE' : '○ STANDARD (LOCKED)'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', margin: '4px 0 2px' }}>Academic Pro Hub & AI Tools</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Pro task scheduler, Tunisian Baccalaureate & university GPA calculators, and personalized AI career guidance.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {!sub.trialUsed && !hasAccessToAll && (
            <button 
              onClick={handleStartFreeTrial} 
              disabled={activatingTrial}
              className="btn btn-secondary"
              style={{ padding: '12px 20px', fontSize: '0.9rem', border: '1px solid var(--text-primary)' }}
            >
              {activatingTrial ? 'Activating...' : '⏳ Try 1 Day For Free'}
            </button>
          )}

          <button 
            onClick={() => setShowCheckoutModal(true)} 
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            {hasAccessToAll ? 'Manage Pro Pass' : 'Unlock Pro Options'}
          </button>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', overflowX: 'auto' }}>
        {[
          { id: 'tasks', label: `Task Manager (${tasks.length})`, accessible: hasTasksAccess },
          { id: 'calculator', label: `Score & GPA Calculator`, accessible: hasCalcAccess },
          { id: 'advisor', label: `AI Career & University Advisor`, accessible: hasAdvisorAccess },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--r-md)',
              border: `1px solid ${activeTab === tab.id ? 'var(--text-primary)' : 'transparent'}`,
              background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all var(--t-fast)'
            }}
          >
            <span>{tab.label}</span>
            {!tab.accessible && <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>[LOCKED]</span>}
          </button>
        ))}
      </div>

      {/* ════ TAB 1: PRO TASK MANAGER ════ */}
      {activeTab === 'tasks' && (
        !hasTasksAccess ? (
          <div className="card glass" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              ✕
            </div>
            <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Pro Task Manager is Locked</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.9rem' }}>
              Activate your 1-day free trial or purchase the Task Manager (or Full Pack) with D17, Flouci, or Card.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!sub.trialUsed && (
                <button onClick={handleStartFreeTrial} className="btn btn-secondary">Start 1-Day Free Trial</button>
              )}
              <button onClick={() => { setSelectedPackage('tasks'); setShowCheckoutModal(true); }} className="btn btn-primary">
                Unlock Task Manager (6 TND)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Academic Milestone & Task Board</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Track exams, revision schedules, internship deadlines, and university applications.</p>
              </div>
              <button onClick={() => setShowAddTaskModal(true)} className="btn btn-primary btn-sm">
                + Add New Task
              </button>
            </div>

            {/* Kanban / Task Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { status: 'todo', label: 'To Do' },
                { status: 'in_progress', label: 'In Progress' },
                { status: 'completed', label: 'Completed' },
              ].map(col => {
                const colTasks = tasks.filter(t => t.status === col.status);

                return (
                  <div key={col.status} className="card glass" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '320px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{col.label}</span>
                      <span style={{ fontSize: '0.78rem', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                        {colTasks.length}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {colTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', padding: '30px 10px' }}>
                          No tasks in this column
                        </div>
                      ) : (
                        colTasks.map(t => (
                          <div 
                            key={t._id} 
                            className="card"
                            style={{
                              padding: '14px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: 'var(--r-md)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: 'var(--r-sm)',
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--glass-border)'
                              }}>
                                {t.priority}
                              </span>
                              <button onClick={() => handleDeleteTask(t._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                                ✕
                              </button>
                            </div>

                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>
                              {t.title}
                            </div>

                            {t.description && (
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {t.description}
                              </p>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : `${t.category}`}
                              </span>
                              <button 
                                onClick={() => handleToggleTaskStatus(t)}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.72rem', padding: '2px 8px', border: '1px solid var(--glass-border)' }}
                              >
                                {t.status === 'completed' ? 'Reopen' : t.status === 'todo' ? 'Start →' : 'Done ✓'}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Task Modal */}
            {showAddTaskModal && (
              <div className="modal-backdrop" onClick={() => setShowAddTaskModal(false)}>
                <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', padding: '28px' }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Schedule Academic Task</h3>
                  <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Task Title *</label>
                      <input 
                        type="text" 
                        value={newTaskTitle} 
                        onChange={e => setNewTaskTitle(e.target.value)} 
                        placeholder="e.g. Revise Algorithms Chapter 4, Submit PFE Proposal"
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description / Details</label>
                      <textarea 
                        rows="2" 
                        value={newTaskDesc} 
                        onChange={e => setNewTaskDesc(e.target.value)} 
                        placeholder="Add notes, formulas, or links..."
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select 
                          value={newTaskCategory} 
                          onChange={e => setNewTaskCategory(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                        >
                          <option value="exam">Exam & Revision</option>
                          <option value="assignment">Assignment / Project</option>
                          <option value="application">University / Stage Application</option>
                          <option value="milestone">Milestone / Goal</option>
                          <option value="study">Self-Study</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select 
                          value={newTaskPriority} 
                          onChange={e => setNewTaskPriority(e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium</option>
                          <option value="high">High Priority</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input 
                        type="date" 
                        value={newTaskDue} 
                        onChange={e => setNewTaskDue(e.target.value)} 
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                      <button type="button" onClick={() => setShowAddTaskModal(false)} className="btn btn-ghost">Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Task</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ════ TAB 2: SCORE & GPA CALCULATOR ════ */}
      {activeTab === 'calculator' && (
        !hasCalcAccess ? (
          <div className="card glass" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              ✕
            </div>
            <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Score & GPA Calculator is Locked</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.9rem' }}>
              Activate your 1-day free trial or purchase the Score Calculator with D17, Flouci, or Card.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!sub.trialUsed && (
                <button onClick={handleStartFreeTrial} className="btn btn-secondary">Start 1-Day Free Trial</button>
              )}
              <button onClick={() => { setSelectedPackage('calculator'); setShowCheckoutModal(true); }} className="btn btn-primary">
                Unlock Calculator (6 TND)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Toggle Type */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setCalcType('bac_formula'); setCalcResult(null); }}
                className={`btn btn-sm ${calcType === 'bac_formula' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Baccalaureate Orientation Formula (FG)
              </button>
              <button
                onClick={() => { setCalcType('university_gpa'); setCalcResult(null); }}
                className={`btn btn-sm ${calcType === 'university_gpa' ? 'btn-primary' : 'btn-secondary'}`}
              >
                University Semester Moyenne & Credits
              </button>
            </div>

            {/* 1. Baccalaureate FG Calculator */}
            {calcType === 'bac_formula' && (
              <div style={{ display: 'grid', gridTemplateColumns: calcResult ? '1.2fr 1fr' : '1fr', gap: '24px' }}>
                <div className="card glass" style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Tunisian Baccalaureate Formule Globale (FG)</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Official Ministry of Higher Education calculation formula used for university orientation and ranking.
                  </p>

                  <form onSubmit={handleCalculateBac} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Baccalaureate Section *</label>
                      <select 
                        value={bacData.section} 
                        onChange={e => setBacData({ ...bacData, section: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-md)', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)' }}
                      >
                        <option value="Mathématiques">Mathématiques (Math)</option>
                        <option value="Sciences Expérimentales">Sciences Expérimentales (Sciences)</option>
                        <option value="Sciences de l'Informatique">Sciences de l'Informatique (Info)</option>
                        <option value="Sciences Techniques">Sciences Techniques (Technique)</option>
                        <option value="Economie et Gestion">Economie et Gestion (Eco-Gestion)</option>
                        <option value="Lettres">Lettres</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Moyenne Gen (MG)</label>
                        <input type="number" step="0.01" min="0" max="20" value={bacData.mg} onChange={e => setBacData({ ...bacData, mg: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Maths Note</label>
                        <input type="number" step="0.01" min="0" max="20" value={bacData.math} onChange={e => setBacData({ ...bacData, math: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Physique (SP)</label>
                        <input type="number" step="0.01" min="0" max="20" value={bacData.sp} onChange={e => setBacData({ ...bacData, sp: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Français</label>
                        <input type="number" step="0.01" min="0" max="20" value={bacData.fr} onChange={e => setBacData({ ...bacData, fr: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Anglais</label>
                        <input type="number" step="0.01" min="0" max="20" value={bacData.ang} onChange={e => setBacData({ ...bacData, ang: e.target.value })} />
                      </div>

                      {bacData.section === 'Sciences de l\'Informatique' && (
                        <>
                          <div className="form-group">
                            <label className="form-label">Algorithmique</label>
                            <input type="number" step="0.01" min="0" max="20" value={bacData.algo} onChange={e => setBacData({ ...bacData, algo: e.target.value })} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Base de Données</label>
                            <input type="number" step="0.01" min="0" max="20" value={bacData.bd} onChange={e => setBacData({ ...bacData, bd: e.target.value })} />
                          </div>
                        </>
                      )}

                      {bacData.section === 'Sciences Expérimentales' && (
                        <div className="form-group">
                          <label className="form-label">SVT Note</label>
                          <input type="number" step="0.01" min="0" max="20" value={bacData.svt} onChange={e => setBacData({ ...bacData, svt: e.target.value })} />
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={calculating} className="btn btn-primary" style={{ width: '100%', padding: '13px', justifyContent: 'center', marginTop: '8px' }}>
                      {calculating ? 'Computing Score...' : 'Calculate Formule Globale (FG)'}
                    </button>
                  </form>
                </div>

                {/* FG Result Card */}
                {calcResult && (
                  <div className="card glass animate-scale-in" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
                    <div className="section-label" style={{ color: 'var(--text-primary)' }}>Orientation Result</div>
                    <div>
                      <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                        {calcResult.formuleGlobale}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Official Formule Globale (Score d'Orientation)
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <div><strong>Formula Used:</strong></div>
                      <div>{calcResult.formulaExplanation}</div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '8px' }}>Eligible Top Institutions:</div>
                      <ul style={{ paddingLeft: '18px', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                        {calcResult.formuleGlobale >= 160 ? (
                          <>
                            <li><strong>INSAT (MPI / CBA)</strong> — Highly Eligible</li>
                            <li><strong>TBS (Tunis Business School)</strong> — Eligible</li>
                            <li><strong>Preparatory Classes (IPEST, EPAM, IPEIT)</strong></li>
                          </>
                        ) : calcResult.formuleGlobale >= 135 ? (
                          <>
                            <li><strong>FST Tunis</strong> — Computer Science / Data</li>
                            <li><strong>ISG / IHEC Tunis</strong> — Business & Finance</li>
                            <li><strong>ESPRIT / MSB</strong> — Engineering & Business</li>
                          </>
                        ) : (
                          <>
                            <li><strong>ISET / ISIMS</strong> — Applied Computing</li>
                            <li><strong>Private University Degree Tracks</strong></li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. University GPA Calculator */}
            {calcType === 'university_gpa' && (
              <div style={{ display: 'grid', gridTemplateColumns: calcResult ? '1.3fr 1fr' : '1fr', gap: '24px' }}>
                <div className="card glass" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', margin: 0 }}>University Semester GPA & Moyenne</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                        Calculate weighted average across semester modules and ECTS credits.
                      </p>
                    </div>
                    <button onClick={handleAddModule} className="btn btn-secondary btn-sm">
                      + Add Module
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {uniModules.map((m, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'center', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)' }}>
                        <input 
                          type="text" 
                          value={m.name} 
                          onChange={e => handleModuleChange(idx, 'name', e.target.value)} 
                          placeholder="Module Name"
                          style={{ padding: '8px' }}
                        />
                        <div>
                          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Note /20</label>
                          <input 
                            type="number" 
                            step="0.25" 
                            min="0" 
                            max="20" 
                            value={m.grade} 
                            onChange={e => handleModuleChange(idx, 'grade', e.target.value)} 
                            style={{ padding: '8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Coef</label>
                          <input 
                            type="number" 
                            step="0.5" 
                            min="0.5" 
                            value={m.coef} 
                            onChange={e => handleModuleChange(idx, 'coef', e.target.value)} 
                            style={{ padding: '8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Credits</label>
                          <input 
                            type="number" 
                            value={m.credit} 
                            onChange={e => handleModuleChange(idx, 'credit', e.target.value)} 
                            style={{ padding: '8px' }}
                          />
                        </div>
                        <button onClick={() => handleRemoveModule(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                          ✕
                        </button>
                      </div>
                    ))}

                    <button onClick={handleCalculateUniGPA} disabled={calculating} className="btn btn-primary" style={{ width: '100%', padding: '13px', justifyContent: 'center', marginTop: '12px' }}>
                      {calculating ? 'Calculating...' : 'Calculate Semester Moyenne & Validation'}
                    </button>
                  </div>
                </div>

                {/* University GPA Result */}
                {calcResult && (
                  <div className="card glass animate-scale-in" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content' }}>
                    <div className="section-label" style={{ color: 'var(--text-primary)' }}>Academic Standing</div>
                    <div>
                      <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                        {calcResult.moyenne} / 20
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        Mention: <strong>{calcResult.mention}</strong>
                      </div>
                    </div>

                    <div style={{ padding: '14px', background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {calcResult.validated ? 'Semester Validated (Admis)' : 'Semester Incomplete (Ajourné / Rachat)'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Total ECTS Credits Validated: <strong>{calcResult.totalCredits} Credits</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* ════ TAB 3: AI CAREER & UNIVERSITY ADVISOR ════ */}
      {activeTab === 'advisor' && (
        !hasAdvisorAccess ? (
          <div className="card glass" style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              ✕
            </div>
            <h3 style={{ fontSize: '1.4rem', margin: 0 }}>AI Career & University Advisor is Locked</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.9rem' }}>
              Activate your 1-day free trial or unlock the AI Advisor with D17, Flouci, or Card.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!sub.trialUsed && (
                <button onClick={handleStartFreeTrial} className="btn btn-secondary">Start 1-Day Free Trial</button>
              )}
              <button onClick={() => { setSelectedPackage('advisor'); setShowCheckoutModal(true); }} className="btn btn-primary">
                Unlock AI Advisor (8 TND)
              </button>
            </div>
          </div>
        ) : (
          <div className="card glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', minHeight: '520px' }}>
            <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.3rem', margin: 0 }}>TuniVerse AI Academic & Career Advisor</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Specialized in Tunisian university admissions, engineering tracks, and tech internships.
              </p>
            </div>

            {/* Chat Messages Log */}
            <div style={{
              flex: 1,
              maxHeight: '440px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '10px 4px'
            }}>
              {aiChat.map((msg, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    gap: '4px'
                  }}
                >
                  <div style={{
                    maxWidth: '82%',
                    padding: '14px 18px',
                    borderRadius: 'var(--r-lg)',
                    background: msg.sender === 'user' ? 'var(--text-primary)' : 'var(--bg-elevated)',
                    color: msg.sender === 'user' ? 'var(--bg-base)' : 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    border: '1px solid var(--glass-border)',
                  }}>
                    {msg.text}

                    {/* Quick Recommendation Chips */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {msg.recommendations.map((rec, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleSendAiMessage(rec)}
                            style={{
                              fontSize: '0.74rem',
                              padding: '4px 10px',
                              borderRadius: 'var(--r-full)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                            }}
                          >
                            {rec}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', padding: '0 4px' }}>
                    {msg.time}
                  </span>
                </div>
              ))}

              {aiLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span className="animate-spin">⟳</span> TuniVerse AI is analyzing Tunisian university tracks...
                </div>
              )}
            </div>

            {/* Input Box */}
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
              <input 
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                placeholder="Ask about Tunisian universities (INSAT, ESPRIT, TBS), majors, or career tips..."
                style={{ flex: 1, padding: '14px' }}
                disabled={aiLoading}
              />
              <button 
                onClick={() => handleSendAiMessage()}
                disabled={aiLoading || !aiInput.trim()}
                className="btn btn-primary"
                style={{ padding: '0 24px' }}
              >
                Send
              </button>
            </div>
          </div>
        )
      )}

      {/* ════ CHECKOUT & PAYMENT MODAL ════ */}
      {showCheckoutModal && (
        <div className="modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', margin: 0 }}>Unlock Academic Pro Hub</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Choose a standalone tool or activate the complete 1-Year Pro Pass.
                </p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Step 1: Select Feature / Bundle */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '10px' }}>1. Select Your Option</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {packages.map(pkg => (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--r-md)',
                        border: `1px solid ${selectedPackage === pkg.id ? 'var(--text-primary)' : 'var(--glass-border)'}`,
                        background: selectedPackage === pkg.id ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all var(--t-fast)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {pkg.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {pkg.desc}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          {pkg.priceTND} TND
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          (${pkg.priceUSD}) / {pkg.period}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: '10px' }}>2. Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'd17', name: 'D17', sub: 'La Poste Tunisienne' },
                    { id: 'flouci', name: 'Flouci', sub: 'Instant Mobile Wallet' },
                    { id: 'carte_bancaire', name: 'Carte Bancaire', sub: 'Tunisian CIB / GIM' },
                    { id: 'international', name: 'International', sub: 'Visa / Mastercard' },
                  ].map(m => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedPaymentMethod(m.id)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--r-md)',
                        border: `1px solid ${selectedPaymentMethod === m.id ? 'var(--text-primary)' : 'var(--glass-border)'}`,
                        background: selectedPaymentMethod === m.id ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all var(--t-fast)'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Payment Details Form */}
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedPaymentMethod === 'd17' && (
                  <div className="form-group">
                    <label className="form-label">D17 Mobile Phone Number *</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 98 123 456 or 55 123 456" 
                      value={phoneD17} 
                      onChange={e => setPhoneD17(e.target.value)}
                      required 
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      You will receive an instant payment confirmation prompt in your D17 app.
                    </span>
                  </div>
                )}

                {selectedPaymentMethod === 'flouci' && (
                  <div className="form-group">
                    <label className="form-label">Flouci Account / Phone Number *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 21 000 000" 
                      value={flouciAccount} 
                      onChange={e => setFlouciAccount(e.target.value)}
                      required 
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Payment request will be dispatched to your Flouci wallet.
                    </span>
                  </div>
                )}

                {(selectedPaymentMethod === 'carte_bancaire' || selectedPaymentMethod === 'international') && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Card Number *</label>
                      <input 
                        type="text" 
                        placeholder="0000 0000 0000 0000" 
                        value={cardNumber} 
                        onChange={e => setCardNumber(e.target.value)}
                        maxLength={19}
                        required 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">MM / YY *</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          value={cardExpiry} 
                          onChange={e => setCardExpiry(e.target.value)}
                          maxLength={5}
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CVV *</label>
                        <input 
                          type="password" 
                          placeholder="123" 
                          value={cardCvv} 
                          onChange={e => setCardCvv(e.target.value)}
                          maxLength={4}
                          required 
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Total & Submit */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total to Pay:</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {packages.find(p => p.id === selectedPackage)?.priceTND} TND
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowCheckoutModal(false)} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={processingPayment} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                    {processingPayment ? 'Processing...' : 'Confirm & Activate'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProStudentHub;
