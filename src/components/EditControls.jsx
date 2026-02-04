import React from "react";

const EditControls = ({ onAdd, onSave, onBack }) => {
  return (
    <div className="edit-controls" role="toolbar" aria-label="Edit menu controls">
      <div className="controls-left">
        <button className="btn btn-add" onClick={onAdd} aria-label="Tambah menu">
          <span className="icon">+</span>
          <span className="label">Tambah Menu</span>
        </button>

        <button className="btn btn-back" onClick={onBack} aria-label="Kembali ke halaman sebelumnya">
          Kembali
        </button>
      </div>

      <div className="controls-right">
        <button className="btn btn-save" onClick={onSave} aria-label="Simpan perubahan">
          Simpan
        </button>
      </div>
    </div>
  );
};

export default EditControls;