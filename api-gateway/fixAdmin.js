const db = require('./dist/config/db.js');
const { UserModel } = require('./dist/models/User.js');
const { hashPassword } = require('./dist/utils/password.js');

(async () => {
    await db.connectMongo();
    const pwd = hashPassword('StrongPassword123!');
    await UserModel.updateOne(
        { email: 'admin@fraud.local' },
        { $set: { password: pwd, role: 'admin', status: 'ACTIVE' } },
        { upsert: true }
    );
    console.log('Admin password updated');
    process.exit(0);
})().catch(console.error);
