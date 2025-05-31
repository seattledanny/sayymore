require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

async function testFirebaseConnection() {
  try {
    console.log('🔥 Testing Firebase Connection...');
    console.log('📋 Environment Variables:');
    console.log(`   API Key: ${process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Auth Domain: ${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Project ID: ${process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Storage Bucket: ${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Messaging Sender ID: ${process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   App ID: ${process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'}`);
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('\n📊 Testing Database Connection...');
    
    // Try to read from the posts collection
    const q = query(collection(db, 'posts'), orderBy('scraped_at', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);
    
    console.log(`✅ Successfully connected to Firebase!`);
    console.log(`📈 Found ${querySnapshot.size} recent posts in database`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   📝 ${data.title.substring(0, 50)}... (r/${data.subreddit}, ${data.score} pts)`);
    });
    
    console.log('\n🎯 Firebase connection is working correctly!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
  }
}

testFirebaseConnection(); 