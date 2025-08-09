// Mock data for admin dashboard when API is not available
export const mockAdminData = {
  topics: [
    {
      id: '1',
      name: 'Science',
      description: 'Scientific concepts and discoveries',
      isActive: true,
      createdAt: { seconds: Date.now() / 1000 },
      questionCount: 25
    },
    {
      id: '2', 
      name: 'History',
      description: 'Historical events and figures',
      isActive: true,
      createdAt: { seconds: Date.now() / 1000 },
      questionCount: 30
    },
    {
      id: '3',
      name: 'Literature',
      description: 'Classic and modern literature',
      isActive: true,
      createdAt: { seconds: Date.now() / 1000 },
      questionCount: 20
    }
  ],

  questions: [
    {
      id: '1',
      question: 'What is the chemical symbol for gold?',
      options: ['Au', 'Ag', 'Go', 'Gd'],
      correctAnswer: 'Au',
      difficulty: 2,
      topic: 'Science',
      subtopic: 'Chemistry',
      attempts: 150,
      correctAttempts: 120,
      isActive: true
    },
    {
      id: '2',
      question: 'Who wrote Romeo and Juliet?',
      options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
      correctAnswer: 'William Shakespeare',
      difficulty: 3,
      topic: 'Literature',
      subtopic: 'Classic Literature',
      attempts: 200,
      correctAttempts: 180,
      isActive: true
    }
  ],

  users: [
    {
      id: '1',
      email: 'user1@example.com',
      displayName: 'John Doe',
      level: 5,
      totalPoints: 1250,
      energy: 4,
      maxEnergy: 5,
      createdAt: { seconds: Date.now() / 1000 - 86400 * 5 },
      lastLogin: new Date().toISOString(),
      isActive: true
    },
    {
      id: '2',
      email: 'user2@example.com', 
      displayName: 'Jane Smith',
      level: 3,
      totalPoints: 750,
      energy: 3,
      maxEnergy: 5,
      createdAt: { seconds: Date.now() / 1000 - 86400 * 10 },
      lastLogin: new Date(Date.now() - 86400 * 1000).toISOString(),
      isActive: true
    },
    {
      id: '3',
      email: 'user3@example.com',
      displayName: 'Mike Johnson',
      level: 7,
      totalPoints: 2100,
      energy: 5,
      maxEnergy: 5,
      createdAt: { seconds: Date.now() / 1000 - 86400 * 15 },
      lastLogin: new Date(Date.now() - 86400 * 2000).toISOString(),
      isActive: true
    }
  ],

  leaderboard: [
    {
      userId: '3',
      userEmail: 'user3@example.com',
      userDisplayName: 'Mike Johnson',
      totalScore: 2100,
      questionsAttempted: 150
    },
    {
      userId: '1',
      userEmail: 'user1@example.com', 
      userDisplayName: 'John Doe',
      totalScore: 1250,
      questionsAttempted: 95
    },
    {
      userId: '2',
      userEmail: 'user2@example.com',
      userDisplayName: 'Jane Smith',
      totalScore: 750,
      questionsAttempted: 60
    }
  ]
};
