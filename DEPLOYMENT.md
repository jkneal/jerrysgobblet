# Deployment Guide for Jerry's Goblet

## Deploy to Render.com

### Prerequisites
- GitHub account
- Render.com account (free tier available)

### Steps

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Deploy**
   - Render will create two services:
     - `goblet-backend` - Your Node.js server
     - `goblet-frontend` - Your React app
   - The frontend will automatically connect to the backend
   - Wait for both services to deploy (takes 2-5 minutes)

4. **Access Your Game**
   - Once deployed, Render will provide URLs for both services
   - Use the **frontend URL** to access your game
   - Example: `https://goblet-frontend.onrender.com`

### Environment Variables

The `render.yaml` file automatically configures:
- Backend URL is injected into the frontend
- CORS is configured for production
- Port is set automatically by Render

### Local Development

For local development, the app uses:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

No environment variables needed for local dev!

### Troubleshooting

**If the game doesn't connect:**
1. Check that both services are running in Render dashboard
2. Verify the backend service is healthy
3. Check browser console for connection errors

**Free tier limitations:**
- Services may spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds to wake up
- Upgrade to paid tier for always-on services
