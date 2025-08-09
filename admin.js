const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdminRole() {
  const uid = "BPMy6HeaEPgeYMQzMSyrYChTf3E3";
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`✅ Admin claim set for UID: ${uid}`);
}

setAdminRole().catch(console.error);
