# Real Estate Support Dashboard

A modern, real-time support and admin dashboard for managing customer conversations in the Real Estate messaging system.

## 🎯 Features

### Core Features

- ✅ **Real-time Messaging** - Socket.io integration for instant message delivery
- ✅ **Thread Management** - View, filter, and search conversations
- ✅ **Status Management** - Close and manage thread status
- ✅ **Statistics Dashboard** - View support metrics and performance
- ✅ **Typing Indicators** - See when users are typing
- ✅ **Online/Offline Status** - Real-time user presence
- ✅ **Read Receipts** - Track message delivery and read status
- ✅ **Image Support** - Send and receive images
- ✅ **Responsive Design** - Works on desktop and tablet

### User Interface

- Modern, clean design with Tailwind CSS
- Dark/light message bubbles
- Conversation list with unread badges
- Priority indicators (low, medium, high, urgent)
- Category tags
- Search and filter functionality

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on `http://172.20.10.6:3000`
- Support or Admin user account

### Installation

1. **Navigate to the Support_Front directory:**

   ```bash
   cd Support_Front
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   The `.env.local` file is already created with default values:

   ```env
   NEXT_PUBLIC_API_URL=http://172.20.10.6:3000
   NEXT_PUBLIC_SOCKET_URL=http://172.20.10.6:3000
   ```

   If your backend is running on a different address, update these values.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 🔐 Login

### Credentials

You need a support or admin account to access the dashboard.

1. **Login at:** `http://localhost:3000/login`
2. **Enter your email and password**
3. **Requirements:**
   - User must have `role: ["support"]` or `role: ["admin"]`
   - Regular users (`role: ["user"]`) will be denied access

### Creating a Support Account

You can create a support account through the backend API:

```bash
POST http://172.20.10.6:3000/api/auth/signup
Content-Type: application/json

{
  "fullName": "Support Agent",
  "email": "support@example.com",
  "password": "your-secure-password",
  "role": ["support"]
}
```

Or update an existing user's role directly in MongoDB:

```javascript
db.users.updateOne(
  { email: "support@example.com" },
  { $set: { role: ["support"] } },
);
```

## 📱 Using the Dashboard

### Main Interface

The dashboard is divided into three main sections:

#### 1. Header (Top)

- User profile with name and role
- Statistics button
- Logout button

#### 2. Thread List (Left Sidebar)

- **Search Bar** - Search conversations by user name or message content
- **Filters:**
  - All - Show all threads
  - Active - Only active conversations
  - Closed - Resolved conversations
  - Unassigned - Threads without assigned agents
- **Thread Items:**
  - User avatar and name
  - Last message preview
  - Time since last message
  - Unread count badge
  - Priority indicator
  - Category tag
  - Status badge

#### 3. Chat Window (Main Area)

- **Header:**
  - User information
  - Online/offline status
  - Message count
  - Close thread button
  - Thread info toggle
- **Messages:**
  - Text messages
  - Image messages
  - Typing indicators
  - Read receipts
  - Message timestamps
- **Input:**
  - Text area with auto-resize
  - Image upload button
  - Send button
  - Enter to send, Shift+Enter for new line

### Features Guide

#### Sending Messages

1. Select a thread from the list
2. Type your message in the input box
3. Press Enter or click Send
4. Or click the image icon to send an image

#### Closing Threads

1. Open the conversation
2. Click "Close Thread" button in the header
3. Confirm the action
4. Thread status will update to "closed"

#### Viewing Statistics

1. Click the "Statistics" button in the header
2. View metrics:
   - Active threads
   - Closed threads
   - Unassigned conversations
   - High priority items
   - Total messages
3. See response metrics and priority distribution
4. Click X to return to conversations

#### Filtering Conversations

- **All** - Shows all threads regardless of status
- **Active** - Only shows ongoing conversations
- **Closed** - Only shows resolved threads
- **Unassigned** - Shows threads that need assignment

#### Searching

- Type in the search box to filter by:
  - User name
  - Message content
- Results update in real-time

## 🔧 Technical Details

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Real-time:** Socket.io Client
- **HTTP Client:** Axios
- **Date Formatting:** date-fns
- **Icons:** React Icons

### Project Structure

```
Support_Front/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page (redirect)
│   ├── login/
│   │   └── page.tsx          # Login page
│   └── dashboard/
│       └── page.tsx          # Main dashboard
├── components/
│   ├── Header.tsx            # Top navigation
│   ├── ThreadList.tsx        # Conversation list
│   ├── ChatWindow.tsx        # Message view
│   └── Statistics.tsx        # Stats dashboard
├── services/
│   └── api.ts                # API service layer
├── store/
│   └── chatStore.ts          # Zustand state
├── hooks/
│   └── useSocket.ts          # Socket.io hook
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

### API Integration

The dashboard connects to these backend endpoints:

**Thread APIs:**

- `GET /api/messages/threads` - List threads
- `GET /api/messages/threads/:id` - Get thread details
- `PATCH /api/messages/threads/:id/status` - Update status
- `POST /api/messages/threads/:id/read` - Mark as read
- `POST /api/messages/threads/:id/assign` - Assign agent

**Message APIs:**

- `GET /api/messages/threads/:id/messages` - Get messages
- `POST /api/messages/threads/:id/messages` - Send message
- `POST /api/messages/threads/:id/messages/image` - Send image
- `PATCH /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

**Support APIs:**

- `GET /api/messages/support/stats` - Get statistics
- `GET /api/messages/unread/count` - Get unread count
- `GET /api/messages/search` - Search messages

### Socket.io Events

**Client Emits:**

- `thread:join` - Join thread room
- `thread:leave` - Leave thread room
- `message:send` - Send message
- `typing:start` - Start typing
- `typing:stop` - Stop typing
- `message:read` - Mark as read

**Server Emits:**

- `message:new` - New message received
- `message:edited` - Message was edited
- `message:deleted` - Message was deleted
- `typing:user` - User typing status
- `messages:read` - Messages read
- `user:online` - User came online
- `user:offline` - User went offline
- `thread:status:changed` - Status updated
- `notification` - General notification

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#FF8C42',     // Change this
      secondary: '#2C3E50',   // Change this
      // ... other colors
    },
  },
},
```

### Changing Backend URL

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://your-backend-url:3000
NEXT_PUBLIC_SOCKET_URL=http://your-backend-url:3000
```

## 🐛 Troubleshooting

### Login Issues

**Problem:** "Access denied. You need support or admin privileges."
**Solution:** Ensure your user account has `role: ["support"]` or `role: ["admin"]` in the database.

### Connection Issues

**Problem:** Cannot connect to backend
**Solution:**

1. Check if backend server is running
2. Verify the API_URL in `.env.local`
3. Check network connectivity
4. Check CORS settings on backend

### Socket.io Not Connecting

**Problem:** Real-time features not working
**Solution:**

1. Check if Socket.io is initialized on backend
2. Verify JWT token is valid
3. Check browser console for errors
4. Ensure firewall allows WebSocket connections

### Images Not Loading

**Problem:** Images show broken icon
**Solution:**

1. Check if backend serves static files from `/uploads`
2. Verify image URL in message
3. Check image file permissions on server

## 📊 Performance Tips

1. **Limit Thread Load:** The default limit is 50 threads. Adjust in `ThreadList.tsx`:

   ```typescript
   const response = await apiService.getThreads({ limit: 50 });
   ```

2. **Message Pagination:** Messages are loaded 100 at a time. Increase for longer conversations:

   ```typescript
   const response = await apiService.getMessages(threadId, { limit: 100 });
   ```

3. **Optimize Renders:** The app uses Zustand for efficient state management. Avoid unnecessary re-renders.

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Deploy to Other Platforms

The app is a standard Next.js application and can be deployed to:

- Vercel
- Netlify
- AWS Amplify
- Docker containers
- Traditional Node.js hosting

## 🔒 Security

- JWT tokens stored in localStorage
- Automatic token refresh on API calls
- Auto-redirect to login on 401 errors
- Role-based access control
- HTTPS recommended for production

## 📝 Future Enhancements

Potential features to add:

- [ ] Thread assignment to specific agents
- [ ] Bulk actions (close multiple threads)
- [ ] Keyboard shortcuts
- [ ] Dark mode toggle
- [ ] Email notifications
- [ ] File attachments (not just images)
- [ ] Voice messages
- [ ] Video calls
- [ ] Canned responses
- [ ] Analytics and reports
- [ ] Multi-language support
- [ ] Mobile responsive improvements

## 📄 License

This project is part of the Real Estate Platform.

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section
2. Review backend logs
3. Check browser console for errors
4. Contact the development team

---

**Happy Supporting! 🎉**
