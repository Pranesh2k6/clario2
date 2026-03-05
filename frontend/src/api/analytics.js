import client from './client';

export const getDashboardAnalytics = () =>
    client.get('/analytics/dashboard');

export const getKnowledgeProfile = () =>
    client.get('/analytics/knowledge');

export const getWeakTopics = () =>
    client.get('/analytics/weak-topics');

export const getSkillRating = () =>
    client.get('/analytics/rating');

export const getRecommendations = () =>
    client.get('/analytics/recommendations');

export const completeRecommendation = (id) =>
    client.post(`/analytics/recommendations/${id}/complete`);
