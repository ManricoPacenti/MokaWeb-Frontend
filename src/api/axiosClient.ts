import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

  //Centralized Axios instance used by all API services
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

//the request interceptor attaches the jwt token to every outgoing request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('moka_access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});