```

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
APP_NAME=Service Marketplace
APP_URL=http://localhost:3000

# Database
DATABASE_URL=db url
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d


# Email Configuration (SendGrid/SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email
EMAIL_PASSWORD=password
EMAIL_FROM=email
EMAIL_FROM_NAME=Elevetor Service

# Cloudinary Configuration (File Storage)
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=csecrate


# Platform Fee (in percentage)
PLATFORM_FEE_PERCENTAGE=10
PLATFORM_TAX_PERCENTAGE=5

# Admin Settings
SUPER_ADMIN_EMAIL=admin@servicemarketplace.com
SUPER_ADMIN_PASSWORD=SuperSecurePassword123!
```
