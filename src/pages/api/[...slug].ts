import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-secret'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const API_BASE_URL = 'https://api-pjqcolhhra-uc.a.run.app';
    
    // Extract the path from the request
    const { slug, ...otherParams } = req.query;
    const path = Array.isArray(slug) ? slug.join('/') : slug || '';
    
    const url = `${API_BASE_URL}/${path}`;
    
    // Forward the request to the actual API
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': req.headers['x-admin-secret'] || '',
        'Authorization': req.headers.authorization || '',
      },
      params: otherParams, // Only forward non-slug parameters
    });

    // Forward the response
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error', message: error.message });
    }
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};
