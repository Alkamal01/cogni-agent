# `cogni-icp`

Welcome to your new `cogni-icp` project and to the Internet Computer development community. By default, creating a new project adds this README and some template files to your project directory. You can edit these template files to customize your project and to include your own code to speed up the development cycle.

To get started, you might want to explore the project directory structure and the default configuration file. Working with this project in your development environment will not affect any production deployment or identity tokens.

To learn more before you start working with `cogni-icp`, see the following documentation available online:

- [Quick Start](https://internetcomputer.org/docs/current/developer-docs/setup/deploy-locally)
- [SDK Developer Tools](https://internetcomputer.org/docs/current/developer-docs/setup/install)
- [Rust Canister Development Guide](https://internetcomputer.org/docs/current/developer-docs/backend/rust/)
- [ic-cdk](https://docs.rs/ic-cdk)
- [ic-cdk-macros](https://docs.rs/ic-cdk-macros)
- [Candid Introduction](https://internetcomputer.org/docs/current/developer-docs/backend/candid/)

If you want to start working on your project right away, you might want to try the following commands:

```bash
cd cogni-icp/
dfx help
dfx canister --help
```

## Running the project locally

If you want to test your project locally, you can use the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

4. **Deploy the canisters**
   ```bash
   dfx deploy
   ```

5. **Start the development server**
   ```bash
   cd src/cogni-icp-frontend
   npm start
   ```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4943`

## 📁 Project Structure

```
cogni-edufy/
├── src/
│   ├── cogni-icp-backend/          # Rust backend canister
│   │   ├── src/
│   │   │   ├── models/            # Data models
│   │   │   │   ├── user.rs        # User management
│   │   │   │   ├── tutor.rs       # Agentic AI tutor system
│   │   │   │   ├── study_group/   # Collaborative learning
│   │   │   │   ├── gamification.rs # Achievement system
│   │   │   │   └── billing.rs     # Subscription management
│   │   │   ├── state.rs           # Canister state management
│   │   │   └── lib.rs             # Main canister logic
│   │   └── Cargo.toml
│   └── cogni-icp-frontend/        # React frontend
│       ├── src/
│       │   ├── components/        # Reusable UI components
│       │   │   ├── auth/          # Authentication components
│       │   │   ├── groups/        # Study group components
│       │   │   ├── tutors/        # AI tutor interface
│       │   │   ├── landing/       # Marketing pages
│       │   │   └── shared/        # Common components
│       │   ├── pages/             # Page components
│       │   ├── contexts/          # React contexts
│       │   ├── services/          # API services
│       │   └── hooks/             # Custom React hooks
│       └── package.json
├── dfx.json                        # DFX configuration
└── package.json                    # Root package.json
```

## 🎯 Core Features

### Agentic AI-Powered Tutoring
- **Super Personalization**: Agentic AI that learns and adapts to your unique learning patterns
- **Multi-Modal Learning**: Chat, Audio, and Video (in progress) learning methods
- **Real-time Chat**: Interactive conversations with AI tutors
- **Knowledge Base**: Upload custom materials for specialized tutoring
- **Progress Tracking**: Monitor learning progress and achievements

### Collaborative Learning
- **Study Groups**: Create and join study groups
- **Real-time Collaboration**: Live group sessions with shared resources
- **Discussion Forums**: Engage in topic-based discussions
- **Resource Sharing**: Share study materials and notes
- **Polls & Surveys**: Interactive group decision-making

### Learning Management
- **Learning Paths**: Structured educational journeys
- **Progress Analytics**: Detailed insights into learning patterns
- **Achievement System**: Gamified learning with badges and rewards
- **Goal Setting**: Set and track learning objectives

### Social Features
- **User Connections**: Connect with other learners
- **Profile Management**: Customizable user profiles
- **Activity Feed**: Track learning activities and achievements
- **Recommendations**: AI-powered study partner suggestions

## 🔧 Development

### Backend Development

The backend is built using Rust and the Internet Computer SDK. Key components include:

- **Data Models**: Comprehensive data structures for all application features
- **State Management**: Efficient memory management using stable structures
- **API Endpoints**: Candid interface for frontend communication
- **Agentic AI Integration**: Advanced LLM-powered tutoring with learning adaptation
- **Multi-Modal Support**: Chat, audio, and video processing capabilities

### Frontend Development

The frontend is a modern React application with TypeScript:

- **Component Architecture**: Modular, reusable components
- **State Management**: Context API for global state
- **Routing**: Client-side routing with React Router
- **Styling**: Tailwind CSS with custom design system

### Available Scripts

```bash
# Development
npm start                    # Start development server
npm run build               # Build for production
npm test                    # Run tests

# DFX Commands
dfx start --background      # Start local replica
dfx deploy                  # Deploy canisters
dfx generate                # Generate Candid interfaces
```

## 🔐 Authentication

CogniEdufy offers multiple authentication options for maximum accessibility:

- **Internet Identity**: Native IC blockchain-based authentication
- **Traditional Login**: Email/password authentication for familiar user experience
- **Principal-based**: Secure user identification on the blockchain
- **Multi-device**: Access from multiple devices securely
- **Flexible Access**: Choose your preferred authentication method

## 💰 Billing & Subscriptions

The platform includes a comprehensive billing system:

- **Subscription Plans**: Multiple tiers for different user needs
- **Payment Processing**: Secure payment handling
- **Usage Tracking**: Monitor feature usage and limits
- **Billing Analytics**: Detailed financial reporting

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly across all devices
- **Dark/Light Themes**: User preference support
- **Smooth Animations**: Engaging user experience
- **Accessibility**: WCAG compliant design
- **Modern Interface**: Clean, intuitive design

## 🚀 Deployment

### Local Development
```bash
dfx start --background
dfx deploy
npm start
```

### Production Deployment
```bash
dfx deploy --network ic
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [DFX Documentation](https://internetcomputer.org/docs/current/developer-docs/setup/install/)
- [Rust Documentation](https://doc.rust-lang.org/)
- [React Documentation](https://reactjs.org/docs/)

## 📞 Support

For support and questions:
- Create an issue in the repository
- Join our community discussions
- Contact the development team

---

**Built with ❤️ on the Internet Computer**
