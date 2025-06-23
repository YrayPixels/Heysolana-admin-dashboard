# HeySolana Admin Dashboard

A React-based admin dashboard for managing HeySolana application data, user analytics, and system administration.

## Features

- 🔐 **Secure Authentication** with two-factor verification
- 📊 **Analytics Dashboard** for tracking user engagement
- 👥 **User Management** and waitlist administration  
- 🔄 **Session Persistence** with automatic token management
- 📱 **Responsive Design** optimized for all devices
- 🚀 **Real-time Updates** with cross-tab synchronization

## Session Management

The dashboard now includes robust session management features:

### Automatic Session Persistence
- Sessions persist across page refreshes and browser tabs
- Automatic token expiration handling (24-hour default)
- Cross-tab synchronization for consistent login state
- Graceful handling of expired sessions

### Authentication Flow
1. **Login**: Email and password authentication
2. **Verification**: Two-factor code sent to email
3. **Session**: Secure token stored with expiration tracking
4. **Auto-logout**: Expired tokens are automatically cleared

### Session Features
- ✅ Persists login state on page refresh
- ✅ Maintains user data across navigation
- ✅ Automatic logout on token expiration
- ✅ Cross-tab session synchronization
- ✅ Loading states during authentication checks
- ✅ Proper error handling for expired sessions

## Getting Started

### Prerequisites
- Node.js 16+ or Bun
- Access to HeySolana backend API

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Heysolana-admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=https://your-api-domain.com/api
   VITE_NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | Required |
| `VITE_NODE_ENV` | Environment mode | `development` |

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── AuthContext.tsx  # Authentication state management
│   └── ui/              # UI component library
├── pages/               # Application pages
├── services/            # API service layer
├── hooks/               # Custom React hooks
├── layouts/             # Layout components
└── config/              # Configuration files
```

## API Integration

The dashboard integrates with the HeySolana backend API for:

- **Authentication**: Login, verification, session management
- **User Analytics**: User distribution, registration trends
- **Waitlist Management**: Add, view, and manage waitlist users
- **Tracking Data**: Button clicks, tool usage, page views
- **Admin Management**: Create and manage admin users

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Authentication Testing

To test the authentication flow:

1. Navigate to the login page
2. Enter valid admin credentials
3. Check email for verification code
4. Enter the verification code
5. Verify session persists on page refresh

## Session Troubleshooting

If you experience session issues:

1. **Check browser console** for authentication errors
2. **Verify API connectivity** and environment variables
3. **Clear localStorage** if sessions are corrupted:
   ```javascript
   localStorage.clear()
   ```
4. **Check network tab** for 401 responses indicating expired tokens

## Security

- All API requests include automatic authentication headers
- Tokens are validated and refreshed automatically
- Expired sessions are handled gracefully
- Cross-tab logout synchronization for security

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test authentication and session management
5. Submit a pull request

## License

Private repository for HeySolana project.