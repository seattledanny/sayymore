const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy, limit, getDocs, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkStatus() {
  try {
    // Get latest posts
    console.log('📊 Latest posts in database:');
    const q = query(collection(db, 'posts'), orderBy('scraped_at', 'desc'), limit(5));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const time = new Date(data.scraped_at).toLocaleTimeString();
      console.log(`  ${time} - r/${data.subreddit}: "${data.title.substring(0,50)}..." (${data.score} pts)`);
    });

    // Count posts by subreddit
    console.log('\n📈 Posts by subreddit:');
    const subreddits = ['AmItheAsshole', 'relationship_advice', 'tifu', 'confession', 'offmychest', 'pettyrevenge', 'MaliciousCompliance', 'entitledparents', 'ChoosingBeggars', 'legaladvice', 'unpopularopinion'];
    
    for (const subreddit of subreddits) {
      const q2 = query(collection(db, 'posts'), where('subreddit', '==', subreddit));
      const snapshot = await getDocs(q2);
      console.log(`  r/${subreddit}: ${snapshot.size} posts`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStatus(); 