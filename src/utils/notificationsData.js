// Up-to-date role-based notifications reflecting current PerformaCOS state
export const ROLE_NOTIFICATIONS = {
  'COS Employee': [],
  'Department Head': [],
  'HR Personnel': [],
};

export const getInitialNotifications = (role) => {
  return ROLE_NOTIFICATIONS[role] || [];
};
