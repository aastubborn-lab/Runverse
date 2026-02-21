import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEYS = {
  USER_PROFILE: 'runverse_user_profile',
  RUNS: 'runverse_runs',
  FEED_POSTS: 'runverse_feed_posts',
  CHALLENGES: 'runverse_challenges',
  PARTNERS: 'runverse_partners',
  ONBOARDING_DONE: 'runverse_onboarding_done',
  WORKOUTS: 'runverse_workouts',
};

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  level: number;
  xp: number;
  totalRuns: number;
  totalDistance: number;
  totalTime: number;
  pace: string;
  goals: string[];
  badges: Badge[];
  joinedDate: string;
  streak: number;
  tier: 'free' | 'premium' | 'pro';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export interface RunRecord {
  id: string;
  date: string;
  distance: number;
  duration: number;
  pace: number;
  calories: number;
  route: { lat: number; lng: number }[];
  elevation: number;
  splits: number[];
}

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'run' | 'meme' | 'highlight' | 'milestone';
  content: string;
  image?: string;
  runData?: { distance: number; duration: number; pace: number };
  likes: number;
  comments: number;
  liked: boolean;
  timestamp: string;
}

export interface Partner {
  id: string;
  name: string;
  avatar: string;
  pace: string;
  distance: string;
  goals: string[];
  compatibility: number;
  status: 'suggested' | 'pending' | 'connected';
  lastActive: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'custom';
  target: number;
  progress: number;
  unit: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  participants: number;
  icon: string;
}

export interface Workout {
  id: string;
  title: string;
  type: 'interval' | 'tempo' | 'easy' | 'long' | 'recovery';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  calories: number;
  description: string;
  completed: boolean;
  completedDate?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  distance: number;
  xp: number;
  streak: number;
  level: number;
}

function generateId(): string {
  return Crypto.randomUUID();
}

const DEFAULT_PROFILE: UserProfile = {
  id: generateId(),
  name: 'Runner',
  username: 'runner',
  avatar: '',
  bio: 'Just started my running journey!',
  level: 1,
  xp: 0,
  totalRuns: 0,
  totalDistance: 0,
  totalTime: 0,
  pace: '0:00',
  goals: ['5K', 'Stay Healthy'],
  badges: [
    { id: '1', name: 'First Step', icon: 'foot-print', earned: true, earnedDate: new Date().toISOString() },
    { id: '2', name: '5K Runner', icon: 'trophy', earned: false },
    { id: '3', name: '10K Champion', icon: 'medal', earned: false },
    { id: '4', name: 'Marathon Hero', icon: 'star', earned: false },
    { id: '5', name: 'Streak Master', icon: 'fire', earned: false },
    { id: '6', name: 'Social Butterfly', icon: 'account-group', earned: false },
  ],
  joinedDate: new Date().toISOString(),
  streak: 0,
  tier: 'free',
};

const SAMPLE_FEED: FeedPost[] = [
  {
    id: generateId(),
    userId: 'u1',
    userName: 'Sarah Chen',
    userAvatar: 'SC',
    type: 'run',
    content: 'Morning run around the park! Perfect weather today.',
    runData: { distance: 5.2, duration: 1560, pace: 5.0 },
    likes: 24,
    comments: 5,
    liked: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: generateId(),
    userId: 'u2',
    userName: 'Alex Rivera',
    userAvatar: 'AR',
    type: 'milestone',
    content: 'Just hit 100km total distance this month! Feeling unstoppable.',
    likes: 45,
    comments: 12,
    liked: false,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: generateId(),
    userId: 'u3',
    userName: 'Jamie Park',
    userAvatar: 'JP',
    type: 'highlight',
    content: 'New personal best on my 10K! Shaved off 2 minutes!',
    runData: { distance: 10.0, duration: 2880, pace: 4.8 },
    likes: 67,
    comments: 18,
    liked: true,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: generateId(),
    userId: 'u4',
    userName: 'Morgan Lee',
    userAvatar: 'ML',
    type: 'run',
    content: 'Evening tempo run. Legs are getting stronger every week.',
    runData: { distance: 8.1, duration: 2430, pace: 5.0 },
    likes: 19,
    comments: 3,
    liked: false,
    timestamp: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: generateId(),
    userId: 'u5',
    userName: 'Chris Okafor',
    userAvatar: 'CO',
    type: 'milestone',
    content: 'Level 10 unlocked! 30-day streak going strong.',
    likes: 89,
    comments: 22,
    liked: false,
    timestamp: new Date(Date.now() - 43200000).toISOString(),
  },
];

const SAMPLE_PARTNERS: Partner[] = [
  { id: 'p1', name: 'Luna Martinez', avatar: 'LM', pace: '5:30/km', distance: '5-10km', goals: ['5K', 'Weight Loss'], compatibility: 95, status: 'suggested', lastActive: '2m ago' },
  { id: 'p2', name: 'Dev Patel', avatar: 'DP', pace: '5:00/km', distance: '10-15km', goals: ['10K', 'Speed'], compatibility: 88, status: 'suggested', lastActive: '15m ago' },
  { id: 'p3', name: 'Yuki Tanaka', avatar: 'YT', pace: '6:00/km', distance: '3-5km', goals: ['Stay Healthy', 'Fun'], compatibility: 82, status: 'connected', lastActive: '1h ago' },
  { id: 'p4', name: 'Nia Johnson', avatar: 'NJ', pace: '4:30/km', distance: '15-20km', goals: ['Marathon', 'Speed'], compatibility: 76, status: 'suggested', lastActive: '3h ago' },
  { id: 'p5', name: 'Felix Weber', avatar: 'FW', pace: '5:15/km', distance: '5-10km', goals: ['5K', '10K'], compatibility: 91, status: 'pending', lastActive: '30m ago' },
];

const SAMPLE_CHALLENGES: Challenge[] = [
  { id: 'c1', title: 'Weekly 25K', description: 'Run 25km this week', type: 'weekly', target: 25, progress: 12.5, unit: 'km', xpReward: 500, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 7 * 86400000).toISOString(), participants: 1245, icon: 'run-fast' },
  { id: 'c2', title: 'Streak Week', description: 'Run every day for 7 days', type: 'weekly', target: 7, progress: 3, unit: 'days', xpReward: 300, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 7 * 86400000).toISOString(), participants: 892, icon: 'fire' },
  { id: 'c3', title: 'Speed Demon', description: 'Run 5K under 25 minutes', type: 'custom', target: 1, progress: 0, unit: 'runs', xpReward: 750, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 86400000).toISOString(), participants: 456, icon: 'lightning-bolt' },
  { id: 'c4', title: 'Monthly 100K', description: 'Run 100km this month', type: 'monthly', target: 100, progress: 32, unit: 'km', xpReward: 2000, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 30 * 86400000).toISOString(), participants: 2341, icon: 'trophy' },
];

const SAMPLE_WORKOUTS: Workout[] = [
  { id: 'w1', title: 'Easy Recovery Run', type: 'recovery', duration: 20, difficulty: 'beginner', calories: 180, description: 'Light jog at conversational pace. Focus on form and breathing.', completed: false },
  { id: 'w2', title: 'Interval Blast', type: 'interval', duration: 30, difficulty: 'intermediate', calories: 350, description: '5 min warmup, 6x(1 min fast / 2 min jog), 5 min cooldown.', completed: false },
  { id: 'w3', title: 'Tempo Builder', type: 'tempo', duration: 40, difficulty: 'intermediate', calories: 420, description: '10 min warmup, 20 min at threshold pace, 10 min cooldown.', completed: true, completedDate: new Date(Date.now() - 86400000).toISOString() },
  { id: 'w4', title: 'Long Steady Run', type: 'long', duration: 60, difficulty: 'advanced', calories: 650, description: 'Sustained effort at easy pace. Build your aerobic base.', completed: false },
  { id: 'w5', title: 'Beginner 5K Prep', type: 'easy', duration: 25, difficulty: 'beginner', calories: 220, description: 'Walk/run intervals: 3 min run, 1 min walk. Repeat 6 times.', completed: false },
];

const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: 'u10', name: 'Emma Wilson', avatar: 'EW', distance: 342.5, xp: 12500, streak: 45, level: 25 },
  { rank: 2, userId: 'u11', name: 'Kai Nakamura', avatar: 'KN', distance: 298.3, xp: 11200, streak: 38, level: 22 },
  { rank: 3, userId: 'u12', name: 'Aisha Patel', avatar: 'AP', distance: 275.1, xp: 10800, streak: 32, level: 21 },
  { rank: 4, userId: 'u13', name: 'Marcus Chen', avatar: 'MC', distance: 256.8, xp: 9500, streak: 28, level: 19 },
  { rank: 5, userId: 'u14', name: 'Sofia Garcia', avatar: 'SG', distance: 234.2, xp: 8900, streak: 25, level: 18 },
  { rank: 6, userId: 'u15', name: 'Liam O\'Brien', avatar: 'LO', distance: 212.7, xp: 8200, streak: 22, level: 17 },
  { rank: 7, userId: 'u16', name: 'Priya Sharma', avatar: 'PS', distance: 198.4, xp: 7600, streak: 19, level: 15 },
  { rank: 8, userId: 'u17', name: 'Jordan Kim', avatar: 'JK', distance: 185.9, xp: 7100, streak: 16, level: 14 },
  { rank: 9, userId: 'u18', name: 'Riley Adams', avatar: 'RA', distance: 172.3, xp: 6500, streak: 14, level: 13 },
  { rank: 10, userId: 'u19', name: 'Zara Ali', avatar: 'ZA', distance: 158.6, xp: 5900, streak: 12, level: 12 },
];

export async function getProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  if (data) return JSON.parse(data);
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
  return DEFAULT_PROFILE;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getRuns(): Promise<RunRecord[]> {
  const data = await AsyncStorage.getItem(KEYS.RUNS);
  return data ? JSON.parse(data) : [];
}

export async function saveRun(run: RunRecord): Promise<void> {
  const runs = await getRuns();
  runs.unshift(run);
  await AsyncStorage.setItem(KEYS.RUNS, JSON.stringify(runs));
}

export async function getFeed(): Promise<FeedPost[]> {
  const data = await AsyncStorage.getItem(KEYS.FEED_POSTS);
  if (data) return JSON.parse(data);
  await AsyncStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(SAMPLE_FEED));
  return SAMPLE_FEED;
}

export async function saveFeed(posts: FeedPost[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(posts));
}

export async function addPost(post: Omit<FeedPost, 'id'>): Promise<FeedPost> {
  const newPost = { ...post, id: generateId() };
  const feed = await getFeed();
  feed.unshift(newPost);
  await saveFeed(feed);
  return newPost;
}

export async function toggleLike(postId: string): Promise<void> {
  const feed = await getFeed();
  const post = feed.find(p => p.id === postId);
  if (post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    await saveFeed(feed);
  }
}

export async function getPartners(): Promise<Partner[]> {
  const data = await AsyncStorage.getItem(KEYS.PARTNERS);
  if (data) return JSON.parse(data);
  await AsyncStorage.setItem(KEYS.PARTNERS, JSON.stringify(SAMPLE_PARTNERS));
  return SAMPLE_PARTNERS;
}

export async function savePartners(partners: Partner[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.PARTNERS, JSON.stringify(partners));
}

export async function getChallenges(): Promise<Challenge[]> {
  const data = await AsyncStorage.getItem(KEYS.CHALLENGES);
  if (data) return JSON.parse(data);
  await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(SAMPLE_CHALLENGES));
  return SAMPLE_CHALLENGES;
}

export async function saveChallenges(challenges: Challenge[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(challenges));
}

export async function getWorkouts(): Promise<Workout[]> {
  const data = await AsyncStorage.getItem(KEYS.WORKOUTS);
  if (data) return JSON.parse(data);
  await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(SAMPLE_WORKOUTS));
  return SAMPLE_WORKOUTS;
}

export async function saveWorkouts(workouts: Workout[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.WORKOUTS, JSON.stringify(workouts));
}

export function getLeaderboard(): LeaderboardEntry[] {
  return SAMPLE_LEADERBOARD;
}

export async function isOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === 'true';
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(paceMinPerKm: number): string {
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDistance(km: number): string {
  return km.toFixed(1);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
