import axios from 'axios';

const api = axios.create({
  baseURL: 'https://xeno-assignment-shopify.onrender.com'
});

export default api;


