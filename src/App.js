import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <div className="container">
          <h1>Reddit Conversations</h1>
          <p className="subtitle">Stories that spark discussion</p>
        </div>
      </header>
      
      <main className="main-content">
        <div className="container">
          <div className="coming-soon">
            <h2>Setting up your conversation starter...</h2>
            <p>We're preparing the most engaging Reddit stories for you!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App; 