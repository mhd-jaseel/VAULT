import mongoose from 'mongoose';

export let isReplicaSet = false;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Probe replica set / transaction capability
    try {
      const topology = conn.connection.client.topology;
      const topType = topology?.description?.type;
      isReplicaSet = topType === 'ReplicaSetWithPrimary' || topType === 'ReplicaSetNoPrimary' || topType === 'Sharded';
      
      if (!isReplicaSet) {
        const adminDb = conn.connection.db.admin();
        const status = await adminDb.command({ isMaster: 1 }).catch(() => ({}));
        isReplicaSet = Boolean(status.setName || status.hosts);
      }

      if (isReplicaSet) {
        console.log('[VAULT DB] MongoDB connected — transaction support available.');
      } else {
        console.log('[VAULT DB] MongoDB connected, but replica-set transaction support is unavailable.');
      }
    } catch (probeErr) {
      console.log('[VAULT DB] MongoDB connected, but replica-set transaction support is unavailable.');
      isReplicaSet = false;
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

