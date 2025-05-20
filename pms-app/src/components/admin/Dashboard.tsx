import React, { useEffect, useState } from 'react';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { User } from '../../types';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingModeration: number;
  dailyActiveUsers: Array<{
    date: string;
    activeUsers: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Get all users
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;

        // Get active users (users who have logged in within the last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const activeUsersQuery = query(
          usersRef,
          where('lastActive', '>=', oneDayAgo.toISOString())
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);
        const activeUsers = activeUsersSnapshot.size;

        // Get users pending moderation
        const pendingUsersQuery = query(
          usersRef,
          where('status', '==', 'pending')
        );
        const pendingUsersSnapshot = await getDocs(pendingUsersQuery);
        const pendingModeration = pendingUsersSnapshot.size;

        // Get daily active users for the past week
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyActiveUsers = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(sevenDaysAgo);
          date.setDate(date.getDate() + i);
          const nextDate = new Date(date);
          nextDate.setDate(date.getDate() + 1);

          const dailyQuery = query(
            usersRef,
            where('lastActive', '>=', date.toISOString()),
            where('lastActive', '<', nextDate.toISOString())
          );
          const dailySnapshot = await getDocs(dailyQuery);

          dailyActiveUsers.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            activeUsers: dailySnapshot.size
          });
        }

        setStats({
          totalUsers,
          activeUsers,
          pendingModeration,
          dailyActiveUsers
        });
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError('Failed to fetch user statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Statistics
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        {/* Total Users Card */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" color="primary">
              Total Users
            </Typography>
            <Typography variant="h3" component="div">
              {stats.totalUsers}
            </Typography>
          </Paper>
        </Box>

        {/* Active Users Card */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" color="primary">
              Active Users (24h)
            </Typography>
            <Typography variant="h3" component="div">
              {stats.activeUsers}
            </Typography>
          </Paper>
        </Box>

        {/* Pending Moderation Card */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" color="primary">
              Pending Moderation
            </Typography>
            <Typography variant="h3" component="div">
              {stats.pendingModeration}
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Daily Active Users Chart */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Daily Active Users (Past Week)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={stats.dailyActiveUsers}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="activeUsers"
              stroke="#8884d8"
              name="Active Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default Dashboard; 