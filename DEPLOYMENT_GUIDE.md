# CogniEdufy Deployment Guide
## Deploying to Internet Computer Playground Network

---

## 🚀 Quick Deploy to Playground

The Internet Computer playground network is perfect for testing and showcasing your application without needing cycles coupons. Here's how to deploy CogniEdufy:

### Prerequisites

1. **Install DFX** (if not already installed):
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. **Verify DFX installation**:
   ```bash
   dfx --version
   ```

### 🎯 Step-by-Step Deployment

#### 1. **Build the Frontend**
```bash
cd src/cogni-icp-frontend
npm install
npm run build
cd ../..
```

#### 2. **Deploy to Playground Network**
```bash
# Deploy all canisters to playground
dfx deploy --playground

# Or deploy specific canisters
dfx deploy cogni-icp-backend --playground
dfx deploy cogni-icp-frontend --playground
```

#### 3. **Generate Candid Interfaces**
```bash
dfx generate --playground
```

#### 4. **Verify Deployment**
```bash
# List deployed canisters
dfx canister --playground status

# Get canister info
dfx canister --playground info cogni-icp-backend
dfx canister --playground info cogni-icp-frontend
```

---

## 🔧 Testing Your Deployment

### Test Backend Functions
```bash
# Test user creation
dfx canister call cogni-icp-backend --playground create_user '("testuser", "test@example.com")'

# Test user registration
dfx canister call cogni-icp-backend --playground register_user '("testuser", "test@example.com", "password123")'

# Get user profile
dfx canister call cogni-icp-backend --playground get_self
```

### Test Frontend Access
After deployment, your frontend will be available at:
```
https://[frontend-canister-id].ic0.app
```

You can find the canister ID in the deployment output or by running:
```bash
dfx canister --playground id cogni-icp-frontend
```

---

## 📋 Playground Network Commands

### General Commands
```bash
# Deploy to playground
dfx deploy --playground

# Call canister functions
dfx canister call <canister-name> --playground <function-name> <arguments>

# Query canister functions
dfx canister call <canister-name> --playground <function-name> <arguments> --query

# Get canister status
dfx canister --playground status <canister-name>

# List all canisters
dfx canister --playground status

# Get canister ID
dfx canister --playground id <canister-name>
```

### Development Workflow
```bash
# Start local replica (for local development)
dfx start --background

# Deploy locally
dfx deploy

# Deploy to playground (for testing/showcasing)
dfx deploy --playground

# Switch between networks
dfx identity use default
dfx identity use playground
```

---

## 🔐 Authentication Setup

### Internet Identity (Recommended)
1. Visit [Internet Identity](https://identity.ic0.app/)
2. Create an anchor for your application
3. Configure the frontend to use your anchor

### Traditional Authentication
The backend supports email/password authentication for users who prefer traditional login methods.

---

## 📊 Monitoring & Debugging

### Check Canister Logs
```bash
# View canister logs
dfx canister --playground call cogni-icp-backend get_logs

# Check canister metrics
dfx canister --playground call cogni-icp-backend get_metrics
```

### Common Issues & Solutions

#### 1. **Build Errors**
```bash
# Clean and rebuild
dfx stop
dfx start --clean --background
dfx deploy --playground
```

#### 2. **Frontend Not Loading**
- Check if the build completed successfully
- Verify the canister ID in the frontend configuration
- Ensure all dependencies are installed

#### 3. **Backend Function Errors**
- Check the function signatures match the Candid interface
- Verify the data types being passed
- Check canister logs for detailed error messages

---

## 🌐 Environment Configuration

### Frontend Environment Variables
Create `.env` file in `src/cogni-icp-frontend/`:
```env
# Playground network configuration
DFX_NETWORK=playground
CANISTER_ID_BACKEND=<your-backend-canister-id>
CANISTER_ID_FRONTEND=<your-frontend-canister-id>

# Optional: Analytics and external services
VITE_ANALYTICS_ID=your_analytics_id
VITE_SUI_NETWORK=testnet
```

### Backend Configuration
The backend automatically detects the network and configures itself accordingly.

---

## 🔄 Continuous Deployment

### Automated Deployment Script
Create `deploy-playground.sh`:
```bash
#!/bin/bash

echo "🚀 Deploying CogniEdufy to Playground Network..."

# Build frontend
echo "📦 Building frontend..."
cd src/cogni-icp-frontend
npm install
npm run build
cd ../..

# Deploy to playground
echo "🌐 Deploying to playground..."
dfx deploy --playground

# Generate interfaces
echo "🔧 Generating Candid interfaces..."
dfx generate --playground

# Get canister IDs
echo "📋 Canister IDs:"
dfx canister --playground id cogni-icp-backend
dfx canister --playground id cogni-icp-frontend

echo "✅ Deployment complete!"
echo "🌍 Frontend URL: https://$(dfx canister --playground id cogni-icp-frontend).ic0.app"
```

Make it executable:
```bash
chmod +x deploy-playground.sh
./deploy-playground.sh
```

---

## 📈 Performance Optimization

### Frontend Optimization
1. **Code Splitting**: React Router automatically splits code by routes
2. **Image Optimization**: Use WebP format and lazy loading
3. **Bundle Analysis**: Monitor bundle size with build tools

### Backend Optimization
1. **Stable Memory**: Efficient use of stable memory structures
2. **Query Optimization**: Use query functions for read-only operations
3. **Memory Management**: Monitor canister memory usage

---

## 🔒 Security Considerations

### Playground Network Security
- Playground is a test network - don't use real credentials
- Data may be reset periodically
- Perfect for demos and testing

### Production Deployment
When ready for production:
1. Deploy to mainnet: `dfx deploy --network ic`
2. Set up proper authentication
3. Configure monitoring and logging
4. Implement proper error handling

---

## 📞 Support & Resources

### Useful Links
- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [DFX Documentation](https://internetcomputer.org/docs/current/developer-docs/setup/install/)
- [Playground Network Info](https://internetcomputer.org/docs/current/developer-docs/setup/playground/)

### Community Support
- [Internet Computer Forum](https://forum.dfinity.org/)
- [Discord Community](https://discord.gg/jnjVVQaE2C)
- [GitHub Issues](https://github.com/your-repo/issues)

---

## 🎯 Next Steps

After successful playground deployment:

1. **Test all features** thoroughly
2. **Document any issues** found
3. **Optimize performance** based on testing
4. **Prepare for mainnet** deployment
5. **Set up monitoring** and analytics

---

**Happy Deploying! 🚀**

*CogniEdufy - Revolutionizing Education with AI and Blockchain*
