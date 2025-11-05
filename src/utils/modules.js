// Available modules in the system
export const MODULES = {
  HRMS: 'hrms',
  OPERATIONS: 'operations',
  FLIGHT_MANAGEMENT: 'flightManagement',
  MARKETING: 'campaigns',
  CRM: 'clients',
  ACCOUNTING: 'accounting',
  TASK_TRACKER: 'taskTracker',
  ANNOUNCEMENTS: 'announcements',
};

// Module display names
export const MODULE_NAMES = {
  [MODULES.HRMS]: 'HRMS',
  [MODULES.OPERATIONS]: 'Operations',
  [MODULES.FLIGHT_MANAGEMENT]: 'Flight Management',
  [MODULES.MARKETING]: 'Marketing',
  [MODULES.CRM]: 'CRM',
  [MODULES.ACCOUNTING]: 'Accounting',
  [MODULES.TASK_TRACKER]: 'Task Tracker',
  [MODULES.ANNOUNCEMENTS]: 'Announcements',
};

// Module descriptions
export const MODULE_DESCRIPTIONS = {
  [MODULES.HRMS]: 'Human Resource Management System',
  [MODULES.OPERATIONS]: 'Operations Management',
  [MODULES.FLIGHT_MANAGEMENT]: 'Flight operations and scheduling',
  [MODULES.MARKETING]: 'Marketing campaigns and analytics',
  [MODULES.CRM]: 'Client relationship management',
  [MODULES.ACCOUNTING]: 'Financial records and accounting',
  [MODULES.TASK_TRACKER]: 'Task tracking and management',
  [MODULES.ANNOUNCEMENTS]: 'System announcements',
};

// Get all modules as array
export const getAllModules = () => {
  return Object.values(MODULES);
};

// Get module display name
export const getModuleName = (moduleKey) => {
  return MODULE_NAMES[moduleKey] || moduleKey;
};

// Get module description
export const getModuleDescription = (moduleKey) => {
  return MODULE_DESCRIPTIONS[moduleKey] || '';
};

export default {
  MODULES,
  MODULE_NAMES,
  MODULE_DESCRIPTIONS,
  getAllModules,
  getModuleName,
  getModuleDescription,
};

