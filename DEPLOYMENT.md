# Deployment Guide

## Prerequisites

- Docker 24+ & Docker Compose v2
- Domain name (for production SSL)
- SSL certificate and private key

## Quick Start (Development)

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs
- Database: localhost:5432
- Redis: localhost:6379

## Production Deployment

### 1. Configure Environment

```bash
cp backend/.env.example .env.prod
```

Edit `.env.prod` with production values:

```env
NODE_ENV=production
JWT_SECRET=<generate-a-strong-random-secret>
DB_PASSWORD=<secure-db-password>
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com
NVD_API_KEY=your-nvd-api-key
COLLECTION_FREQUENCY=daily
```

### 2. SSL Certificates

Place your SSL certificate and key in `nginx/ssl/`:

```bash
cp /path/to/your/cert.pem nginx/ssl/cert.pem
cp /path/to/your/key.pem nginx/ssl/key.pem
chmod 600 nginx/ssl/key.pem
```

To generate self-signed cert for testing:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"
```

### 3. Start Production Stack

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### 4. Verify

```bash
# Check all services are healthy
docker-compose -f docker-compose.prod.yml ps

# Test API health
curl -k https://localhost/api/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Database

### Backup

```bash
docker exec sep-db pg_dump -U postgres security_events > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
docker exec -i sep-db psql -U postgres security_events < backup.sql
```

## Cloud Deployment

### AWS EC2

```bash
# Install Docker on EC2
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone <repo-url>
cd security-event-platform
# Set up .env.prod and SSL certs
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

### Azure VM

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Follow same steps as AWS above
```

### Alibaba Cloud ECS

```bash
# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Follow same steps as AWS above
```

## Monitoring

- Container health: `docker ps` (look at STATUS column)
- Resource usage: `docker stats`
- Log viewing: `docker-compose -f docker-compose.prod.yml logs -f [service]`
- API metrics: `GET /api/health` returns uptime and memory usage

## Scaling

For higher traffic, consider:
- Running multiple backend instances behind nginx load balancer
- Using managed PostgreSQL (AWS RDS, Azure Database, etc.)
- Using managed Redis (AWS ElastiCache, Azure Cache, etc.)
- Setting up a container orchestrator (Kubernetes, ECS)

## Security Checklist

- [ ] Change all default passwords in `.env.prod`
- [ ] Generate a strong `JWT_SECRET` (min 32 chars): `openssl rand -hex 32`
- [ ] Use real SSL certificates (not self-signed) in production
- [ ] Configure firewall to only expose ports 80/443
- [ ] Set up database backups schedule
- [ ] Enable PostgreSQL `pg_stat_statements` for query monitoring
- [ ] Review `nginx/nginx.conf` server_name for your domain
- [ ] Test WebSocket connectivity through nginx
- [ ] Run `docker scout quickview` for vulnerability scanning
