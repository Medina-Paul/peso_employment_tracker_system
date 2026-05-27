// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import all your routers
import applicantRoutes from './src/routes/applicantRoutes.js';
import educationRoutes from './src/routes/educationRoutes.js';
import linguisticsRoutes from './src/routes/linguisticsRoutes.js';
import overseasRoutes from './src/routes/overseasRoutes.js';
import employmentRoutes from './src/routes/employmentRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import credentialsRoutes from './src/routes/credentialsRoutes.js';
import trainingsRoutes from './src/routes/trainingsRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount all the endpoints
app.use('/api/applicants', applicantRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/linguistics', linguisticsRoutes);
app.use('/api/overseas', overseasRoutes);
app.use('/api/employment', employmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/trainings', trainingsRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));