# Swim Timer Pro

A comprehensive swimming timing application for swim clubs and coaches to track swimmer performance, record lap times, and analyze progress over time.

## Features

- **User Authentication**: Secure login system with admin and regular user roles
- **Swimmer Management**: Add, edit, and delete swimmer profiles
- **Time Tracking**: Record and track swim times with precision timing
- **Lap Analysis**: Break down performances by laps with detailed split times
- **Performance History**: View historical performance data for each swimmer
- **Data Visualization**: Analyze progress with performance charts
- **Multi-Device Support**: Responsive design works on desktop and mobile devices
- **Dark/Light Mode**: User-selectable theme preference

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui components
- **Authentication & Database**: Firebase Authentication and Firestore
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom theming
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 16.8+ and npm/pnpm
- Firebase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/swim-timer-pro.git
   cd swim-timer-pro
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration details

4. Set up Firebase:
   - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password provider
   - Create a Firestore database 
   - Deploy the Firestore security rules from `firestore.rules`
   - Enable Storage for club logo uploads

5. Run the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
3. Get your Firebase configuration from Project Settings > General > Your Apps > SDK setup and configuration
4. Add these values to your `.env.local` file

### Initial User Setup

To create the first admin user:

1. Start the application
2. Register a new account
3. In the Firebase console, go to Firestore and create a document in the `users` collection with:
   ```
   id: [user-auth-uid]
   email: [user-email]
   displayName: [name]
   isAdmin: true
   ```

## Usage

1. **Login**: Access the system with your credentials
2. **Add Swimmers**: Create profiles for each swimmer
3. **Record Times**: Use the timer to record swim sessions
4. **View History**: Check historical performance data
5. **Manage Users**: Admins can add and manage other users

## Deployment

### Deploy to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

1. Push your code to a Git repository
2. Import the project to Vercel
3. Add your environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication and database by [Firebase](https://firebase.google.com/) 