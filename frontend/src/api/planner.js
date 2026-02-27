import client from './client';

export const getPlannerSummary = (startDate, endDate) =>
    client.get('/planner/summary', { params: { startDate, endDate } });

export const getTasksByDate = (date) =>
    client.get('/planner/tasks', { params: { date } });

export const createTask = (data) =>
    client.post('/planner/tasks', data);

export const toggleTaskCompletion = (id, is_completed) =>
    client.patch(`/planner/tasks/${id}`, { is_completed });

export const deleteTask = (id) =>
    client.delete(`/planner/tasks/${id}`);

export const getSuggestions = () =>
    client.get('/planner/suggestions');

export const generateSmartPlan = (data) =>
    client.post('/planner/generate', data);
