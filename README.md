# Pedidos AdaSoft

Sistema de gestión de pedidos y facturación para vendedores.

## 🚀 Deployment Options

### Option 1: Web App (Current - localStorage)
```bash
npm run build:web
```
- Uses browser localStorage
- Works offline
- No server required

### Option 2: Mobile APK + MySQL Backend

#### Backend Setup:
1. **Setup MySQL Database:**
```bash
cd server
npm install
mysql -u root -p < scripts/init-database.sql
```

2. **Configure Environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start Backend:**
```bash
npm run dev  # Development
npm start    # Production
```

#### Frontend Setup:
1. **Configure for Production:**
```bash
cp .env.production .env
# Edit EXPO_PUBLIC_API_URL with your server URL
```

2. **Build APK:**
```bash
eas build --platform android
```

## 📱 Default Credentials

**Vendedores:**
- ID: `V001`, Nombre: `Juan`
- ID: `V002`, Nombre: `Maria`

**Administrador:**
- ID: `ADMIN`, Nombre: `Administrador`

## 🛠️ Tech Stack

- **Frontend:** React Native + Expo
- **Backend:** Node.js + Express
- **Database:** MySQL (Production) / localStorage (Development)
- **UI:** React Native Paper + Custom Components

## 📊 Features

- ✅ Login system for vendors and admins
- ✅ Product management with categories
- ✅ Client management
- ✅ Order creation and tracking
- ✅ Invoice generation and printing
- ✅ Payment receipts
- ✅ Inventory management
- ✅ Settings configuration
- ✅ Tax calculation (ITBIS included/applied)

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for web
npm run build:web
```

## 📦 Production Deployment

1. **Deploy Backend:** Upload server folder to your hosting provider
2. **Configure Database:** Run init-database.sql on your MySQL server
3. **Build APK:** Use EAS Build with production environment variables
4. **Test:** Verify API connectivity and data persistence

## 🔒 Security Notes

- All API endpoints should be secured with authentication
- Use HTTPS in production
- Validate all input data
- Implement rate limiting
- Use environment variables for sensitive data