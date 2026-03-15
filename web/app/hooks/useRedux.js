import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as userActions from '@/store/slices/userSlice';
import * as roleActions from '@/store/slices/roleSlice';
import * as permissionActions from '@/store/slices/permissionSlice';
import * as rolePermissionActions from '@/store/slices/rolePermissionSlice';
import * as employeeActions from '@/store/slices/employeeSlice';
import * as studentActions from '@/store/slices/studentSlice';
import * as departmentActions from '@/store/slices/departmentSlice';
import * as applicationActions from '@/store/slices/applicationSlice';
import * as paymentActions from '@/store/slices/paymentSlice';
import * as examActions from '@/store/slices/examSlice';
import * as settingsActions from '@/store/slices/settingsSlice';

// =====================================================
// SIMPLE REDUX HOOKS - All Slices Included!
// =====================================================

// ---------------------
// USERS
// ---------------------
export const useUsers = () => {
  const dispatch = useDispatch();
  const usersState = useSelector(state => state.users || { users: [], loading: false, error: null });
  const fetchUsers = useCallback(() => dispatch(userActions.fetchUsers()), [dispatch]);
  
  return {
    users: usersState.users || [],
    loading: usersState.loading || false,
    error: usersState.error || null,
    fetchUsers,
    createUser: (data) => dispatch(userActions.createUser(data)),
    updateUser: (id, data) => dispatch(userActions.updateUser({ id, data })),
    deleteUser: (id) => dispatch(userActions.deleteUser(id)),
    clearError: () => dispatch(userActions.clearError())
  };
};

// ---------------------
// ROLES
// ---------------------
export const useRoles = () => {
  const dispatch = useDispatch();
  const rolesState = useSelector(state => state.roles || { roles: [], loading: false, error: null });
  const fetchRoles = useCallback(() => dispatch(roleActions.fetchRoles()), [dispatch]);
  
  return {
    roles: rolesState.roles || [],
    loading: rolesState.loading || false,
    error: rolesState.error || null,
    fetchRoles,
    createRole: (data) => dispatch(roleActions.createRole(data)),
    updateRole: (id, data) => dispatch(roleActions.updateRole({ id, data })),
    deleteRole: (id) => dispatch(roleActions.deleteRole(id)),
    clearError: () => dispatch(roleActions.clearError())
  };
};

// ---------------------
// PERMISSIONS
// ---------------------
export const usePermissionsData = () => {
  const dispatch = useDispatch();
  const permissionsState = useSelector(state => state.permissions || { permissions: [], loading: false, error: null });
  const fetchPermissions = useCallback(() => dispatch(permissionActions.fetchPermissions()), [dispatch]);
  
  return {
    permissions: permissionsState.permissions || [],
    loading: permissionsState.loading || false,
    error: permissionsState.error || null,
    fetchPermissions,
    createPermission: (data) => dispatch(permissionActions.createPermission(data)),
    updatePermission: (id, data) => dispatch(permissionActions.updatePermission({ id, data })),
    deletePermission: (id) => dispatch(permissionActions.deletePermission(id)),
    softDeletePermission: (id) => dispatch(permissionActions.softDeletePermission(id)),
    clearError: () => dispatch(permissionActions.clearError())
  };
};

// Backward-compatible alias used by some dashboard pages
export const usePermissionActions = usePermissionsData;

// ---------------------
// ROLE PERMISSIONS
// ---------------------
export const useRolePermissions = () => {
  const dispatch = useDispatch();
  const rolePermissionState = useSelector(state => state.rolePermission || { 
    rolePermissions: [], 
    permissions: [], 
    roles: [],
    stats: null,
    loading: false, 
    error: null 
  });
  const fetchAllRolePermissions = useCallback(() => dispatch(rolePermissionActions.fetchAllRolePermissions()), [dispatch]);
  const fetchRolePermissions = useCallback((roleId) => dispatch(rolePermissionActions.fetchRolePermissions(roleId)), [dispatch]);
  const fetchRolesByPermission = useCallback((permissionId) => dispatch(rolePermissionActions.fetchRolesByPermission(permissionId)), [dispatch]);
  const fetchRolePermissionStats = useCallback(() => dispatch(rolePermissionActions.fetchRolePermissionStats()), [dispatch]);
  
  return {
    rolePermissions: rolePermissionState.rolePermissions || [],
    permissions: rolePermissionState.permissions || [],
    roles: rolePermissionState.roles || [],
    stats: rolePermissionState.stats || null,
    loading: rolePermissionState.loading || false,
    error: rolePermissionState.error || null,
    fetchAllRolePermissions,
    fetchRolePermissions,
    fetchRolesByPermission,
    createRolePermission: (data) => dispatch(rolePermissionActions.createRolePermission(data)),
    assignPermissionsToRole: (data) => dispatch(rolePermissionActions.assignPermissionsToRole(data)),
    removePermissionsFromRole: (data) => dispatch(rolePermissionActions.removePermissionsFromRole(data)),
    replaceRolePermissions: (data) => dispatch(rolePermissionActions.replaceRolePermissions(data)),
    removePermissionFromRole: (data) => dispatch(rolePermissionActions.removePermissionFromRole(data)),
    removeAllPermissionsFromRole: (roleId) => dispatch(rolePermissionActions.removeAllPermissionsFromRole(roleId)),
    checkRolePermission: (data) => dispatch(rolePermissionActions.checkRolePermission(data)),
    bulkCreateRolePermissions: (assignments) => dispatch(rolePermissionActions.bulkCreateRolePermissions(assignments)),
    bulkDeleteRolePermissions: (assignments) => dispatch(rolePermissionActions.bulkDeleteRolePermissions(assignments)),
    fetchRolePermissionStats,
    clearError: () => dispatch(rolePermissionActions.clearError())
  };
};

// ---------------------
// EMPLOYEES
// ---------------------
export const useEmployees = () => {
  const dispatch = useDispatch();
  const employeesState = useSelector(state => state.employees || { 
    employees: [], 
    schemas: [],
    currentSchema: null,
    schemaFields: [],
    loading: false, 
    error: null 
  });
  const fetchEmployees = useCallback(() => dispatch(employeeActions.fetchEmployees()), [dispatch]);
  const fetchEmployeeSchemas = useCallback(() => dispatch(employeeActions.fetchEmployeeSchemas()), [dispatch]);
  const fetchEmployeeStats = useCallback(() => dispatch(employeeActions.fetchEmployeeStats()), [dispatch]);
  
  return {
    employees: employeesState.employees || [],
    schemas: employeesState.schemas || [],
    currentSchema: employeesState.currentSchema || null,
    schemaFields: employeesState.schemaFields || [],
    loading: employeesState.loading || false,
    error: employeesState.error || null,
    fetchEmployees,
    fetchEmployeeSchemas,
    createEmployee: (data) => dispatch(employeeActions.createEmployee(data)),
    updateEmployee: (id, data) => dispatch(employeeActions.updateEmployee({ id, data })),
    deleteEmployee: (id) => dispatch(employeeActions.deleteEmployee(id)),
    createEmployeeLogin: (id, send_welcome_email) => dispatch(employeeActions.createEmployeeLogin({ id, send_welcome_email })),
    fetchEmployeeStats,
    clearError: () => dispatch(employeeActions.clearError())
  };
};

// ---------------------
// EMPLOYEE SCHEMA ACTIONS
// ---------------------
export const useEmployeeSchemaActions = () => {
  const dispatch = useDispatch();
  
  return {
    createEmployeeSchema: (data) => dispatch(employeeActions.createEmployeeSchema(data)),
    updateEmployeeSchema: (id, data) => dispatch(employeeActions.updateEmployeeSchema({ id, data })),
    deleteEmployeeSchema: (id) => dispatch(employeeActions.deleteEmployeeSchema(id)),
    getEmployeeSchemaById: (id) => dispatch(employeeActions.getEmployeeSchemaById(id)),
    getEmployeeSchemaFields: (schemaId) => dispatch(employeeActions.getEmployeeSchemaFields(schemaId)),
    addEmployeeSchemaField: (schemaId, fieldData) => dispatch(employeeActions.addEmployeeSchemaField({ schemaId, fieldData })),
    updateEmployeeSchemaField: (schemaId, fieldId, fieldData) => dispatch(employeeActions.updateEmployeeSchemaField({ schemaId, fieldId, fieldData })),
    deleteEmployeeSchemaField: (schemaId, fieldId) => dispatch(employeeActions.deleteEmployeeSchemaField({ schemaId, fieldId }))
  };
};

// ---------------------
// STUDENTS
// ---------------------
export const useStudents = () => {
  const dispatch = useDispatch();
  const studentsState = useSelector(state => state.students || { students: [], loading: false, error: null });
  const fetchStudents = useCallback(() => dispatch(studentActions.fetchStudents()), [dispatch]);
  const fetchStudentSchemas = useCallback(() => dispatch(studentActions.fetchStudentSchemas()), [dispatch]);
  
  return {
    students: studentsState.students || [],
    schemas: studentsState.schemas || [], // Student schemas
    loading: studentsState.loading || false,
    error: studentsState.error || null,
    fetchStudents,
    createStudent: (data) => dispatch(studentActions.createStudent(data)),
    updateStudent: (payload) => dispatch(studentActions.updateStudent(payload)),
    deleteStudent: (id) => dispatch(studentActions.deleteStudent(id)),
    createStudentLogin: (id, send_welcome_email = false) => dispatch(studentActions.createStudentLogin({ id, send_welcome_email })),
    // Student Schema Actions
    fetchStudentSchemas,
    createStudentSchema: (data) => dispatch(studentActions.createStudentSchema(data)),
    updateStudentSchema: (id, data) => dispatch(studentActions.updateStudentSchema({ id, data })),
    deleteStudentSchema: (id) => dispatch(studentActions.deleteStudentSchema(id)),
    clearError: () => dispatch(studentActions.clearError())
  };
};

// ---------------------
// DEPARTMENTS
// ---------------------
export const useDepartments = () => {
  const dispatch = useDispatch();
  const departmentsState = useSelector(state => state.departments || { departments: [], loading: false, error: null });
  const fetchDepartments = useCallback(() => dispatch(departmentActions.fetchDepartments()), [dispatch]);
  
  return {
    departments: departmentsState.departments || [],
    loading: departmentsState.loading || false,
    error: departmentsState.error || null,
    fetchDepartments,
    createDepartment: (data) => dispatch(departmentActions.createDepartment(data)),
    updateDepartment: (id, data) => dispatch(departmentActions.updateDepartment({ id, data })),
    deleteDepartment: (id) => dispatch(departmentActions.deleteDepartment(id)),
    clearError: () => dispatch(departmentActions.clearError())
  };
};

// ---------------------
// APPLICATIONS
// ---------------------
export const useApplications = () => {
  const dispatch = useDispatch();
  const applicationsState = useSelector(state => state.applications || { 
    applications: [], 
    schemas: [], 
    loading: false, 
    error: null 
  });
  const fetchApplications = useCallback(() => dispatch(applicationActions.fetchApplications()), [dispatch]);
  const fetchMyApplications = useCallback(() => dispatch(applicationActions.fetchMyApplications()), [dispatch]);
  const fetchApplicationById = useCallback((id) => dispatch(applicationActions.fetchApplicationById(id)), [dispatch]);
  const fetchApplicationSchemas = useCallback(() => dispatch(applicationActions.fetchApplicationSchemas()), [dispatch]);
  const fetchApplicationStats = useCallback(() => dispatch(applicationActions.fetchApplicationStats()), [dispatch]);
  
  return {
    applications: applicationsState.applications || [],
    schemas: applicationsState.schemas || [],
    loading: applicationsState.loading || false,
    error: applicationsState.error || null,
    fetchApplications,
    fetchMyApplications,
    fetchApplicationById,
    fetchApplicationSchemas,
    createApplication: (data) => dispatch(applicationActions.createApplication(data)),
    createApplicationSchema: (data) => dispatch(applicationActions.createApplicationSchema(data)),
    updateApplication: (id, data) => dispatch(applicationActions.updateApplication({ id, data })),
    updateApplicationSchema: (id, data) => dispatch(applicationActions.updateApplicationSchema({ id, data })),
    deleteApplication: (id) => dispatch(applicationActions.deleteApplication(id)),
    deleteApplicationSchema: (id) => dispatch(applicationActions.deleteApplicationSchema(id)),
    submitApplication: (id, data) => dispatch(applicationActions.submitApplication({ id, data })),
    updateApplicationStatus: (id, status, notes) => dispatch(applicationActions.updateApplicationStatus({ id, status, notes })),
    updateApplicationPaymentStatus: (id, status) => dispatch(applicationActions.updateApplicationPaymentStatus({ id, status })),
    fetchApplicationStats,
    uploadApplicationPassportPhoto: (id, formData) => dispatch(applicationActions.uploadApplicationPassportPhoto({ id, formData })),
    sendAcceptanceLetter: (id) => dispatch(applicationActions.sendAcceptanceLetter(id)),
    generateAdmissionLetter: (id) => dispatch(applicationActions.generateAdmissionLetter(id)),
    clearError: () => dispatch(applicationActions.clearError())
  };
};

// ---------------------
// PAYMENTS
// ---------------------
export const usePayments = () => {
  const dispatch = useDispatch();
  const paymentsState = useSelector(state => state.payment || { payments: [], loading: false, error: null });
  const fetchPayments = useCallback(() => dispatch(paymentActions.fetchPayments()), [dispatch]);
  const fetchMyPayments = useCallback(() => dispatch(paymentActions.fetchMyPayments()), [dispatch]);
  const fetchPaymentsByApplicant = useCallback((applicantId) => dispatch(paymentActions.fetchPaymentsByApplicant(applicantId)), [dispatch]);
  const fetchPaymentStats = useCallback(() => dispatch(paymentActions.fetchPaymentStats()), [dispatch]);
  const fetchPaymentOverview = useCallback(() => dispatch(paymentActions.fetchPaymentOverview()), [dispatch]);
  
  return {
    payments: paymentsState.payments || [],
    loading: paymentsState.loading || false,
    error: paymentsState.error || null,
    fetchPayments,
    fetchMyPayments,
    fetchPaymentsByApplicant,
    initializePayment: (data) => dispatch(paymentActions.initializePayment(data)),
    verifyPayment: (reference) => dispatch(paymentActions.verifyPayment(reference)),
    fetchPaymentStats,
    fetchPaymentOverview,
    clearError: () => dispatch(paymentActions.clearError())
  };
};

// ---------------------
// EXAMS
// ---------------------
export const useExams = () => {
  const dispatch = useDispatch();
  const examsState = useSelector(state => state.exam || { 
    entryDates: [], 
    examCards: [], 
    loading: false, 
    error: null 
  });
  const fetchEntryDates = useCallback(() => dispatch(examActions.fetchEntryDates()), [dispatch]);
  const fetchExamCards = useCallback(() => dispatch(examActions.fetchExamCards()), [dispatch]);
  const fetchExamStats = useCallback(() => dispatch(examActions.fetchExamStats()), [dispatch]);
  
  return {
    entryDates: examsState.entryDates || [],
    examCards: examsState.examCards || [],
    loading: examsState.loading || false,
    error: examsState.error || null,
    fetchEntryDates,
    fetchExamCards,
    createEntryDate: (data) => dispatch(examActions.createEntryDate(data)),
    createExamCard: (data) => dispatch(examActions.createExamCard(data)),
    updateEntryDate: (id, data) => dispatch(examActions.updateEntryDate({ id, data })),
    updateExamCard: (params) => dispatch(examActions.updateExamCard(params)),
    deleteEntryDate: (id) => dispatch(examActions.deleteEntryDate(id)),
    deleteExamCard: (id) => dispatch(examActions.deleteExamCard(id)),
    markExamCardAsPrinted: (id) => dispatch(examActions.markExamCardAsPrinted(id)),
    fetchExamStats,
    clearError: () => dispatch(examActions.clearError())
  };
};

// ---------------------
// SETTINGS
// ---------------------
export const useSettings = () => {
  const dispatch = useDispatch();
  const settingsState = useSelector(state => state.settings || { 
    schoolSettings: null,
    systemSettings: null,
    emailSettings: null,
    securitySettings: null,
    fileUploads: [],
    selectedFileUpload: null,
    fileUploadStats: null,
    loading: false, 
    error: null 
  });
  const fetchSchoolSettings = useCallback(() => dispatch(settingsActions.fetchSchoolSettings()), [dispatch]);
  const fetchSystemSettings = useCallback(() => dispatch(settingsActions.fetchSystemSettings()), [dispatch]);
  const fetchEmailSettings = useCallback(() => dispatch(settingsActions.fetchEmailSettings()), [dispatch]);
  const fetchSecuritySettings = useCallback(() => dispatch(settingsActions.fetchSecuritySettings()), [dispatch]);
  const fetchFileUploads = useCallback((params) => dispatch(settingsActions.fetchFileUploads(params)), [dispatch]);
  const fetchFileUploadById = useCallback((id) => dispatch(settingsActions.fetchFileUploadById(id)), [dispatch]);
  const fetchFileUploadStats = useCallback(() => dispatch(settingsActions.fetchFileUploadStats()), [dispatch]);
  const fetchFileUploadsByCategory = useCallback((category) => dispatch(settingsActions.fetchFileUploadsByCategory(category)), [dispatch]);
  
  return {
    schoolSettings: settingsState.schoolSettings || null,
    systemSettings: settingsState.systemSettings || null,
    emailSettings: settingsState.emailSettings || null,
    securitySettings: settingsState.securitySettings || null,
    fileUploads: settingsState.fileUploads || [],
    selectedFileUpload: settingsState.selectedFileUpload || null,
    fileUploadStats: settingsState.fileUploadStats || null,
    loading: settingsState.loading || false,
    error: settingsState.error || null,
    // School Settings
    fetchSchoolSettings,
    updateSchoolSettings: (data) => dispatch(settingsActions.updateSchoolSettings(data)),
    uploadSchoolLogo: (formData) => dispatch(settingsActions.uploadSchoolLogo(formData)),
    uploadSchoolFavicon: (formData) => dispatch(settingsActions.uploadSchoolFavicon(formData)),
    // System Settings
    fetchSystemSettings,
    updateSystemSettings: (data) => dispatch(settingsActions.updateSystemSettings(data)),
    resetSystemSettings: () => dispatch(settingsActions.resetSystemSettings()),
    // Email Settings
    fetchEmailSettings,
    updateEmailSettings: (data) => dispatch(settingsActions.updateEmailSettings(data)),
    testEmailSettings: (data) => dispatch(settingsActions.testEmailSettings(data)),
    // Security Settings
    fetchSecuritySettings,
    updateSecuritySettings: (data) => dispatch(settingsActions.updateSecuritySettings(data)),
    resetSecuritySettings: () => dispatch(settingsActions.resetSecuritySettings()),
    // File Uploads
    fetchFileUploads,
    fetchFileUploadById,
    createFileUpload: (formData) => dispatch(settingsActions.createFileUpload(formData)),
    updateFileUpload: (id, data) => dispatch(settingsActions.updateFileUpload({ id, fileData: data })),
    deleteFileUpload: (id) => dispatch(settingsActions.deleteFileUpload(id)),
    fetchFileUploadStats,
    fetchFileUploadsByCategory,
    updateFileUploadSettings: (data) => dispatch(settingsActions.updateFileUploadSettings(data)),
    clearError: () => dispatch(settingsActions.clearError())
  };
};
