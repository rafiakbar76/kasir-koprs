import React from 'react';

const Dashboard = ({ onLoginClick }) => {
  return (
    <div className="main-container">
      <div className="page-content">
        <div className="welcome-wrapper">
          <h1 className="welcome-title">SELAMAT DATANG</h1>
          <p className="welcome-subtitle">KOPRS.CO</p>
          <button className="login-btn" onClick={onLoginClick}>
            LOGIN
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
