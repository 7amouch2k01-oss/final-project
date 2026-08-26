import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import StudentDashboard from './student/StudentDashboard';
import CitizenDashboard from './citizen/CitizenDashboard';

export const Dashboard = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="page flex-center"><p>Loading session…</p></div>;
  }

  // Admins and citizens have full access to the citizen career feed & community board
  if (user.role === 'citizen' || user.role === 'admin') {
    return <CitizenDashboard />;
  }

  return <StudentDashboard />;
};

export default Dashboard;
