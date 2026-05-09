# Hotel Booking System - Deployment Guide

## Pre-Deployment Checklist

- [ ] All API endpoints tested with Postman or cURL
- [ ] Frontend components tested in browser
- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] CORS settings appropriate for production
- [ ] JWT secret is strong and unique
- [ ] Database backups scheduled
- [ ] Error logging configured
- [ ] Rate limiting added
- [ ] Input validation complete

## Environment Variables

### Backend (.env)
```
# Database
DB_HOST=production-db.example.com
DB_PORT=5432
DB_NAME=hotel_booking_prod
DB_USER=prod_user
DB_PASS=strong_password_here

# JWT
JWT_SECRET=your_very_strong_secret_key_with_random_characters_123456

# Server
PORT=5000
NODE_ENV=production

# Email (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Payment (optional)
STRIPE_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Exchange API
EXCHANGE_API_KEY=your_api_key
EXCHANGE_API_URL=https://api.example.com/rates
```

## Deployment Options

### Option 1: Heroku (Quick & Easy)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Procfile** (in root directory)
   ```
   web: cd backend && npm start
   ```

3. **Create heroku.yml** (in root directory)
   ```yaml
   build:
     docker:
       backend: backend/Dockerfile
       frontend: frontend/Dockerfile
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku create your-app-name
   heroku config:set JWT_SECRET=your_secret
   git push heroku main
   ```

### Option 2: AWS EC2

1. **Launch EC2 Instance** (Ubuntu 20.04)

2. **Install Dependencies**
   ```bash
   sudo apt-get update
   sudo apt-get install nodejs npm postgresql postgresql-contrib nginx
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/hotel-booking.git
   cd hotel-booking
   ```

4. **Setup Backend**
   ```bash
   cd backend
   npm install
   npm run seed
   pm2 start server.js --name "hotel-api"
   ```

5. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run build
   # Serve with nginx
   sudo cp -r build/* /var/www/html/
   ```

6. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           root /var/www/html;
           try_files $uri /index.html;
       }

       location /api {
           proxy_pass http://localhost:5000;
       }
   }
   ```

### Option 3: Docker & Docker Compose

1. **Create Backend Dockerfile**
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 5000
   CMD ["npm", "start"]
   ```

2. **Create Frontend Dockerfile**
   ```dockerfile
   FROM node:16-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. **Production docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: hotel_booking
         POSTGRES_USER: hb_user
         POSTGRES_PASSWORD: secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data

     backend:
       build: ./backend
       ports:
         - "5000:5000"
       environment:
         DB_HOST: postgres
         DB_NAME: hotel_booking
         DB_USER: hb_user
         DB_PASS: secure_password
         JWT_SECRET: your_secret
       depends_on:
         - postgres

     frontend:
       build: ./frontend
       ports:
         - "80:80"
       depends_on:
         - backend

   volumes:
     postgres_data:
   ```

   **Deploy:**
   ```bash
   docker-compose up -d
   ```

### Option 4: DigitalOcean App Platform

1. Link GitHub repository
2. Create app.yaml:
   ```yaml
   name: hotel-booking
   services:
   - name: backend
     github:
       branch: main
       repo: username/hotel-booking
     build_command: cd backend && npm install
     run_command: cd backend && npm start
     envs:
     - key: JWT_SECRET
       scope: RUN_AND_BUILD_TIME
       value: your_secret
   - name: frontend
     github:
       branch: main
       repo: username/hotel-booking
     build_command: cd frontend && npm install && npm run build
     run_command: cd frontend && npm start
   ```
3. Push to GitHub → App Platform auto-deploys

## Post-Deployment

### Database Management
```bash
# Backup database
pg_dump hotel_booking > backup.sql

# Restore database
psql hotel_booking < backup.sql

# Migrate to new version
npm run migrate
```

### Monitoring
```bash
# View logs (PM2)
pm2 logs

# View logs (Docker)
docker-compose logs -f backend
docker-compose logs -f frontend

# System monitoring
top
free -h
df -h
```

### Security Hardening

1. **Enable HTTPS**
   ```bash
   # Use Let's Encrypt with Certbot
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Update Dependencies**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

3. **Database Security**
   - Use strong passwords
   - Enable SSL for database connections
   - Restrict database access to backend only
   - Enable query logging

4. **API Security**
   - Add rate limiting
   - Implement CORS properly
   - Add request validation
   - Sanitize inputs
   - Add security headers

### Performance Optimization

1. **Frontend**
   - Enable gzip compression
   - Cache static assets
   - Use CDN for assets
   - Lazy load components

2. **Backend**
   - Add database indexing
   - Implement caching (Redis)
   - Enable query optimization
   - Add pagination to list endpoints

3. **Database**
   - Monitor query performance
   - Add necessary indexes
   - Archive old data
   - Optimize queries

## Scaling Considerations

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Upgrade database tier

### Horizontal Scaling
```yaml
# Load balancer configuration
services:
  backend1:
    # Instance 1
  backend2:
    # Instance 2
  nginx:
    # Load balancer
```

### Database Scaling
- Use read replicas
- Implement sharding
- Archive historical data

## Continuous Deployment

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          # Your deployment script
```

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs
# Check ports
netstat -tuln
# Check resources
free -h
```

### Database connection issues
```bash
# Test connection
psql -h host -U user -d database
# Check firewall
sudo ufw status
```

### High CPU/Memory usage
```bash
# Find resource hogs
top
# Restart services
pm2 restart all
# Scale up resources
```

## Cost Estimation (Monthly)

- **Heroku**: $7-50 (depending on dyno type)
- **AWS EC2**: $10-50 (t2.small to t2.medium)
- **DigitalOcean**: $5-20 (basic droplet)
- **Database**: $0-20 (included in most plans)
- **Domain**: $10-15 (annual, ~$1 monthly)

**Total**: $20-100/month depending on platform and scale

## Support & Maintenance

- [ ] Set up monitoring alerts
- [ ] Schedule daily backups
- [ ] Plan maintenance windows
- [ ] Document deployment process
- [ ] Create runbooks for common issues
- [ ] Regular security audits
- [ ] Performance optimization reviews