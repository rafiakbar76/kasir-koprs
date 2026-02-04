import React from "react";

const BackButton = ({ onBackFallback, children = "Kembali", className = "btn-back" }) => {
  const handleClick = () => {
    // gunakan history.back bila ada, jika tidak jalankan fallback (ke dashboard)
    if (window.history.length > 1) {
      window.history.back();
    } else if (onBackFallback) {
      onBackFallback();
    } else {
      // default fallback: reload ke root
      window.location.href = "/";
    }
  };

  return (
    <button className={className} onClick={handleClick}>
      {children}
    </button>
  );
};

export default BackButton;