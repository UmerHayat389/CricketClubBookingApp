import axios from 'axios';
import BASE_URL from '../config/baseUrl';

const API = axios.create({
  baseURL: BASE_URL,
});

export default API;